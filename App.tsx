import React, { useState, useRef, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { ToolType, ImageAdjustments, FilterType, ProcessingStatus } from './types';
import { loadImage, applyFilters, removeColorRange, transformImage, fileToDataUri } from './utils/imageUtils';
import { removeBackgroundAI } from './services/aiService';
import { Upload, AlertCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const INITIAL_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.ADJUST);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null); 
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(INITIAL_ADJUSTMENTS);
  const [tolerance, setTolerance] = useState<number>(30);
  const [activeFilter, setActiveFilter] = useState<FilterType>(FilterType.NONE);
  const [status, setStatus] = useState<ProcessingStatus>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and draw image whenever dependencies change
  useEffect(() => {
    if (!imageSrc && !processedImageSrc) return;
    
    const render = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Use processed source if available (this contains transforms/erases), otherwise original
        const srcToUse = processedImageSrc || imageSrc;
        if (!srcToUse) return;

        try {
            const img = await loadImage(srcToUse);
            
            // Set canvas size to image size
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            // Apply filters and adjustments non-destructively on each render
            applyFilters(ctx, canvas.width, canvas.height, adjustments, activeFilter);
        } catch (e) {
            console.error("Failed to render image", e);
        }
    };

    render();
  }, [imageSrc, processedImageSrc, adjustments, activeFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUri = await fileToDataUri(file);
        setImageSrc(dataUri);
        setProcessedImageSrc(null);
        setAdjustments(INITIAL_ADJUSTMENTS);
        setActiveFilter(FilterType.NONE);
        setErrorMsg(null);
      } catch (e) {
        setErrorMsg("Failed to load image.");
      }
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== ToolType.REMOVE_BG) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Get clicked color from the CURRENT rendering (which includes adjustments)
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const targetColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    
    removeColorRange(ctx, canvas.width, canvas.height, targetColor, tolerance);
    
    const newDataUri = canvas.toDataURL('image/png');
    setProcessedImageSrc(newDataUri);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setActiveFilter(FilterType.NONE);
  };

  const handleAutoRemoveBg = async () => {
      // Use processed image if exists (e.g. already rotated), otherwise original
      const srcToUse = processedImageSrc || imageSrc;
      if (!srcToUse) return;

      setStatus('PROCESSING');
      setErrorMsg(null);

      try {
          // This might take a while on first run (downloading models)
          const resultUri = await removeBackgroundAI(srcToUse);
          setProcessedImageSrc(resultUri);
          setAdjustments(INITIAL_ADJUSTMENTS);
          setActiveFilter(FilterType.NONE);
          setStatus('SUCCESS');
      } catch (e: any) {
          console.error(e);
          setStatus('ERROR');
          setErrorMsg("AI Model failed to load. Please try again or check internet connection.");
      } finally {
        // Clear success status after a moment
        setTimeout(() => {
            if (status !== 'ERROR') setStatus('IDLE');
        }, 2000);
      }
  };

  const handleTransform = async (type: 'ROTATE_90' | 'FLIP_H' | 'FLIP_V') => {
      const srcToUse = processedImageSrc || imageSrc;
      if (!srcToUse) return;

      const newDataUri = await transformImage(srcToUse, type);
      setProcessedImageSrc(newDataUri);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'purecut-pro-edit.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
  };

  const handleReset = () => {
      setAdjustments(INITIAL_ADJUSTMENTS);
      setActiveFilter(FilterType.NONE);
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur z-10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <ImageIcon className="text-white" size={18} />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    PureCut Pro
                </h1>
            </div>
            
            <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700">
                    <Upload size={16} />
                    Open Image
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>
        </header>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative flex items-center justify-center bg-zinc-950 p-8 overflow-hidden">
            {!imageSrc ? (
                <div className="text-center text-zinc-500 space-y-4">
                    <div className="w-24 h-24 rounded-2xl bg-zinc-900 mx-auto flex items-center justify-center border-2 border-dashed border-zinc-800 animate-pulse">
                        <Upload size={32} className="opacity-50" />
                    </div>
                    <p className="font-medium text-zinc-400">Open an image to start editing</p>
                </div>
            ) : (
                <div className="relative shadow-2xl shadow-black/50 max-w-full max-h-full">
                   <canvas 
                     ref={canvasRef} 
                     className={`max-w-full max-h-[calc(100vh-8rem)] object-contain transition-all duration-200 ${activeTool === ToolType.REMOVE_BG ? 'cursor-crosshair' : 'cursor-default'}`}
                     onClick={handleCanvasClick}
                   />
                </div>
            )}

             {/* Status Indicators */}
             {status === 'PROCESSING' && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 text-zinc-200 px-6 py-4 rounded-xl flex flex-col items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 fade-in shadow-2xl">
                    <Loader2 size={28} className="animate-spin text-purple-500" />
                    <span className="font-medium">AI Processing...</span>
                    <span className="text-xs text-zinc-500">First run may take 10-20s to download models</span>
                </div>
            )}

            {(status === 'ERROR' || errorMsg) && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 fade-in">
                    <AlertCircle size={20} />
                    <span>{errorMsg || "An error occurred"}</span>
                    <button onClick={() => { setErrorMsg(null); setStatus('IDLE'); }} className="hover:text-white"><X size={16}/></button>
                </div>
            )}
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="w-80 h-full shrink-0 z-20">
        <Toolbar 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            tolerance={tolerance}
            setTolerance={setTolerance}
            hasImage={!!imageSrc}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onRotate={() => handleTransform('ROTATE_90')}
            onFlipH={() => handleTransform('FLIP_H')}
            onFlipV={() => handleTransform('FLIP_V')}
            onReset={handleReset}
            onExport={handleExport}
            onAutoRemoveBg={handleAutoRemoveBg}
            isProcessing={status === 'PROCESSING'}
        />
      </div>
    </div>
  );
}

export default App;
