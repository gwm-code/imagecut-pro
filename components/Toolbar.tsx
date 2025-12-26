import React from 'react';
import { 
  Sliders, 
  Eraser, 
  Palette, 
  RotateCcw, 
  Download, 
  Wand2,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ToolType, ImageAdjustments, FilterType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (t: ToolType) => void;
  adjustments: ImageAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<ImageAdjustments>>;
  tolerance: number;
  setTolerance: (n: number) => void;
  hasImage: boolean;
  activeFilter: FilterType;
  setActiveFilter: (f: FilterType) => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onReset: () => void;
  onExport: () => void;
  onAutoRemoveBg: () => void;
  isProcessing: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  adjustments,
  setAdjustments,
  tolerance,
  setTolerance,
  hasImage,
  activeFilter,
  setActiveFilter,
  onRotate,
  onFlipH,
  onFlipV,
  onReset,
  onExport,
  onAutoRemoveBg,
  isProcessing
}) => {
  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  if (!hasImage) return null;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border-l border-zinc-800 text-sm">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTool(ToolType.ADJUST)}
          className={`flex-1 p-4 flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors ${activeTool === ToolType.ADJUST ? 'text-blue-500 bg-zinc-800 border-b-2 border-blue-500' : 'text-zinc-400'}`}
        >
          <Sliders size={20} />
          <span>Adjust</span>
        </button>
        <button
          onClick={() => setActiveTool(ToolType.REMOVE_BG)}
          className={`flex-1 p-4 flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors ${activeTool === ToolType.REMOVE_BG ? 'text-blue-500 bg-zinc-800 border-b-2 border-blue-500' : 'text-zinc-400'}`}
        >
          <Eraser size={20} />
          <span>Erase</span>
        </button>
        <button
          onClick={() => setActiveTool(ToolType.FILTERS)}
          className={`flex-1 p-4 flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors ${activeTool === ToolType.FILTERS ? 'text-blue-500 bg-zinc-800 border-b-2 border-blue-500' : 'text-zinc-400'}`}
        >
          <Palette size={20} />
          <span>Filters</span>
        </button>
        <button
          onClick={() => setActiveTool(ToolType.TRANSFORM)}
          className={`flex-1 p-4 flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors ${activeTool === ToolType.TRANSFORM ? 'text-blue-500 bg-zinc-800 border-b-2 border-blue-500' : 'text-zinc-400'}`}
        >
          <Crop size={20} />
          <span>Edit</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Adjustment Controls */}
        {activeTool === ToolType.ADJUST && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <div className="flex justify-between mb-2 text-zinc-400 font-medium">
                <span>Brightness</span>
                <span>{adjustments.brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.brightness}
                onChange={(e) => handleAdjustmentChange('brightness', Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-zinc-400 font-medium">
                <span>Contrast</span>
                <span>{adjustments.contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.contrast}
                onChange={(e) => handleAdjustmentChange('contrast', Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-zinc-400 font-medium">
                <span>Saturation</span>
                <span>{adjustments.saturation}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.saturation}
                onChange={(e) => handleAdjustmentChange('saturation', Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            
             <div className="pt-4 border-t border-zinc-800">
                <button 
                    onClick={onReset}
                    className="w-full py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-2 transition-colors"
                >
                    <RotateCcw size={16} />
                    Reset All
                </button>
             </div>
          </div>
        )}

        {/* Removal Controls */}
        {activeTool === ToolType.REMOVE_BG && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Auto AI Section */}
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/20 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    Auto AI Removal
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                    Automatically detects and removes background. Runs 100% in browser.
                </p>
                <button
                    onClick={onAutoRemoveBg}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Remove Background
                        </>
                    )}
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-zinc-900 px-2 text-xs text-zinc-500">OR USE MANUAL</span>
                </div>
            </div>

            {/* Manual Section */}
            <div className="mt-6">
                 <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-zinc-300 text-sm mb-4">
                    <p className="flex items-start gap-2">
                        <Wand2 className="shrink-0 mt-0.5 text-blue-400" size={16} />
                        <strong>Magic Wand:</strong> Click the image to erase specific colors.
                    </p>
                </div>
                
                <div>
                    <div className="flex justify-between mb-2 text-zinc-400 font-medium">
                        <span>Color Tolerance</span>
                        <span>{tolerance}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="150"
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
          </div>
        )}

        {/* Filters Controls */}
        {activeTool === ToolType.FILTERS && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-2 gap-3">
                {Object.values(FilterType).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`p-3 rounded-lg border text-left transition-all ${activeFilter === filter ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        <span className="capitalize">{filter.toLowerCase().replace('_', ' ')}</span>
                    </button>
                ))}
             </div>
          </div>
        )}

         {/* Transform Controls */}
         {activeTool === ToolType.TRANSFORM && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-3">
                <button
                    onClick={onRotate}
                    className="w-full py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between transition-colors group"
                >
                    <span className="flex items-center gap-2"><RotateCw size={18} /> Rotate 90°</span>
                </button>
                <button
                    onClick={onFlipH}
                    className="w-full py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between transition-colors group"
                >
                    <span className="flex items-center gap-2"><FlipHorizontal size={18} /> Flip Horizontal</span>
                </button>
                <button
                    onClick={onFlipV}
                    className="w-full py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between transition-colors group"
                >
                    <span className="flex items-center gap-2"><FlipVertical size={18} /> Flip Vertical</span>
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
        <button
            onClick={onExport}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
            <Download size={18} />
            Export Image
        </button>
      </div>
    </div>
  );
};