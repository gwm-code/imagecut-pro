import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Wand2, 
  Sliders, 
  RotateCw, 
  Trash2, 
  Undo2,
  Image as ImageIcon,
  Loader2,
  Eraser,
  FlipHorizontal
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { Slider } from './components/ui/Slider';
import { Adjustments, ActiveTool } from './types';
import { DEFAULT_ADJUSTMENTS, applyFiltersToCanvas, readFileAsDataURL, performMagicWand } from './utils/imageProcessing';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [activeTool, setActiveTool] = useState<ActiveTool>('adjust');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  // Magic Wand State
  const [wandTolerance, setWandTolerance] = useState(32);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize image on load
  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        originalImageRef.current = img;
        const canvas = canvasRef.current!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        applyFiltersToCanvas(canvas.getContext('2d')!, img, adjustments);
      };
    }
  }, [imageSrc]);

  // Re-apply filters when adjustments change
  useEffect(() => {
    if (originalImageRef.current && canvasRef.current) {
      applyFiltersToCanvas(
        canvasRef.current.getContext('2d')!, 
        originalImageRef.current, 
        adjustments
      );
    }
  }, [adjustments]);

  const updateImageWithHistory = (newSrc: string) => {
    if (imageSrc) {
      setHistory(prev => [...prev.slice(-10), imageSrc]); // Keep last 10
    }
    setImageSrc(newSrc);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setImageSrc(previous);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await readFileAsDataURL(file);
      setImageSrc(url);
      setHistory([]);
      setAdjustments(DEFAULT_ADJUSTMENTS);
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'purecut-edited.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageSrc) return;
    
    setIsProcessing(true);
    setProcessingMessage('Downloading AI Model... (This happens once)');
    
    try {
      const blob = await removeBackground(imageSrc, {
        progress: (key: string, current: number, total: number) => {
          setProcessingMessage(`Processing: ${Math.round((current / total) * 100)}%`);
        }
      });
      
      const url = URL.createObjectURL(blob);
      updateImageWithHistory(url);
      setAdjustments(DEFAULT_ADJUSTMENTS); 
      setActiveTool('adjust');
    } catch (error) {
      console.error(error);
      alert('Failed to remove background. Ensure WebGL is enabled.');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'magic-wand' || !originalImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas display size
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Actual coordinates in the image
    const actualX = Math.floor(x * scaleX);
    const actualY = Math.floor(y * scaleY);

    if (actualX >= 0 && actualX < canvas.width && actualY >= 0 && actualY < canvas.height) {
      setIsProcessing(true);
      setProcessingMessage('Applying Magic Wand...');
      
      // Use setTimeout to allow UI to show loading state
      setTimeout(() => {
        const newImageSrc = performMagicWand(
          originalImageRef.current!, 
          actualX, 
          actualY, 
          wandTolerance
        );
        updateImageWithHistory(newImageSrc);
        setIsProcessing(false);
        setProcessingMessage('');
      }, 50);
    }
  };

  const updateAdjustment = (key: keyof Adjustments, value: any) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const resetCanvas = () => {
    if (confirm("Clear canvas?")) {
      setImageSrc(null);
      setHistory([]);
      setAdjustments(DEFAULT_ADJUSTMENTS);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden">
      
      {/* LEFT TOOLBAR */}
      <aside className="w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-6 z-10">
        <div className="mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <span className="text-2xl">✂️</span>
          </div>
        </div>

        <div className="space-y-4 w-full px-2">
          <ToolButton 
            active={activeTool === 'adjust'} 
            onClick={() => setActiveTool('adjust')}
            icon={<Sliders size={20} />} 
            label="Adjust" 
          />
          <ToolButton 
            active={activeTool === 'filters'} 
            onClick={() => setActiveTool('filters')}
            icon={<Wand2 size={20} />} 
            label="Filters" 
          />
           <ToolButton 
            active={activeTool === 'magic-wand'} 
            onClick={() => setActiveTool('magic-wand')}
            icon={<Eraser size={20} />} 
            label="Magic Cut" 
          />
          <div className="h-px bg-zinc-800 mx-2 my-2" />
           <ToolButton 
            active={false}
            onClick={() => updateAdjustment('rotation', (adjustments.rotation + 90) % 360)}
            icon={<RotateCw size={20} />} 
            label="Rotate" 
          />
          <ToolButton 
            active={adjustments.flipX}
            onClick={() => updateAdjustment('flipX', !adjustments.flipX)}
            icon={<FlipHorizontal size={20} />} 
            label="Mirror" 
          />
        </div>

        <div className="mt-auto space-y-4 w-full px-2">
           <ToolButton 
            active={false}
            onClick={() => handleUndo()}
            icon={<Undo2 size={20} />} 
            label="Undo"
            disabled={history.length === 0}
          />
           <ToolButton 
            active={false}
            onClick={resetCanvas}
            icon={<Trash2 size={20} />} 
            label="Clear" 
            danger
          />
        </div>
      </aside>

      {/* CENTER CANVAS AREA */}
      <main className="flex-1 relative bg-zinc-950 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm">
          <h1 className="font-semibold text-lg tracking-tight">PureCut <span className="text-indigo-400">Pro</span></h1>
          
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors text-sm font-medium">
              <Upload size={16} />
              <span>Open Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            
            <button 
              onClick={handleDownload}
              disabled={!imageSrc}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors text-sm font-medium shadow-lg shadow-indigo-900/20"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Canvas Wrapper */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-zinc-950/50">
          {!imageSrc ? (
            <div className="text-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="text-zinc-500" size={32} />
              </div>
              <h3 className="text-xl font-medium text-zinc-300 mb-2">No image loaded</h3>
              <p className="text-zinc-500 mb-6 max-w-xs mx-auto">Upload an image to start editing background, adjusting colors, and applying filters.</p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer transition-colors font-medium">
                <Upload size={18} />
                <span>Select Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm overflow-hidden checkered-bg max-w-full max-h-full">
               <canvas 
                ref={canvasRef} 
                onClick={handleCanvasClick}
                className={`max-w-full max-h-[80vh] object-contain block ${activeTool === 'magic-wand' ? 'cursor-crosshair' : ''}`}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-white font-medium">{processingMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Instruction Toast for Magic Wand */}
        {activeTool === 'magic-wand' && imageSrc && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800/90 text-zinc-200 px-4 py-2 rounded-full text-sm font-medium border border-zinc-700 shadow-xl pointer-events-none">
            Click on a color to remove it (Magic Wand)
          </div>
        )}
      </main>

      {/* RIGHT PROPERTIES PANEL */}
      <aside className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col z-10">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">
            {activeTool === 'adjust' ? 'Adjustments' : 
             activeTool === 'magic-wand' ? 'Magic Cut Tool' : 
             activeTool === 'filters' ? 'AI & Filters' : 'Tools'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {activeTool === 'adjust' && (
            <div className="space-y-6">
              <Slider 
                label="Brightness" 
                value={adjustments.brightness} 
                min={0} max={200} 
                onChange={(v) => updateAdjustment('brightness', v)} 
                unit="%"
                disabled={!imageSrc}
              />
              <Slider 
                label="Contrast" 
                value={adjustments.contrast} 
                min={0} max={200} 
                onChange={(v) => updateAdjustment('contrast', v)} 
                unit="%"
                disabled={!imageSrc}
              />
              <Slider 
                label="Saturation" 
                value={adjustments.saturation} 
                min={0} max={200} 
                onChange={(v) => updateAdjustment('saturation', v)} 
                unit="%"
                disabled={!imageSrc}
              />
               <Slider 
                label="Blur" 
                value={adjustments.blur} 
                min={0} max={20} 
                onChange={(v) => updateAdjustment('blur', v)} 
                unit="px"
                disabled={!imageSrc}
              />
               <div className="pt-4 border-t border-zinc-800">
                 <button 
                  onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  disabled={!imageSrc}
                 >
                   <Undo2 size={12} /> Reset Adjustments
                 </button>
               </div>
            </div>
          )}

          {activeTool === 'filters' && (
            <div className="space-y-6">
               <div className="p-4 bg-indigo-900/20 border border-indigo-900/50 rounded-lg mb-6">
                <h3 className="text-indigo-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <Wand2 size={14} /> AI Background Removal
                </h3>
                <p className="text-xs text-indigo-200/60 mb-3 leading-relaxed">
                  Best for people and objects. May over-crop complex logos.
                </p>
                <button
                  onClick={handleRemoveBackground}
                  disabled={!imageSrc || isProcessing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Remove Background (AI)
                </button>
              </div>

              <div className="space-y-6">
                <Slider 
                  label="Grayscale" 
                  value={adjustments.grayscale} 
                  min={0} max={100} 
                  onChange={(v) => updateAdjustment('grayscale', v)} 
                  unit="%"
                  disabled={!imageSrc}
                />
                <Slider 
                  label="Sepia" 
                  value={adjustments.sepia} 
                  min={0} max={100} 
                  onChange={(v) => updateAdjustment('sepia', v)} 
                  unit="%"
                  disabled={!imageSrc}
                />
              </div>
            </div>
          )}

          {activeTool === 'magic-wand' && (
            <div className="space-y-6">
               <div className="p-4 bg-emerald-900/20 border border-emerald-900/50 rounded-lg mb-6">
                <h3 className="text-emerald-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <Eraser size={14} /> Magic Cut Mode
                </h3>
                <p className="text-xs text-emerald-200/60 mb-3 leading-relaxed">
                  Click on any color in the image to remove it and all connected similar colors.
                </p>
                <div className="text-xs text-emerald-200/40">
                  <strong className="text-emerald-400">Tip:</strong> Use for logos or if AI removes too much.
                </div>
              </div>

              <Slider 
                label="Color Tolerance" 
                value={wandTolerance} 
                min={0} max={100} 
                onChange={setWandTolerance} 
                disabled={!imageSrc}
              />
              <p className="text-xs text-zinc-500">
                Higher tolerance removes more colors similar to the one you click.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// Subcomponent for Toolbar Buttons
const ToolButton = ({ active, icon, label, onClick, danger, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all group ${
      active 
        ? 'bg-zinc-800 text-white' 
        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
    } ${danger ? 'hover:text-red-400 hover:bg-red-900/10' : ''} ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);