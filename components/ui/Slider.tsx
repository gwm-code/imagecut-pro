import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  unit?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, onChange, unit = '', disabled }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-500">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
      />
    </div>
  );
};