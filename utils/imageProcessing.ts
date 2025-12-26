import { Adjustments } from '../types';

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  rotation: 0
};

export const applyFiltersToCanvas = (
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement, 
  adjustments: Adjustments
) => {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  
  ctx.save();
  
  // Handle Rotation
  ctx.translate(width / 2, height / 2);
  ctx.rotate((adjustments.rotation * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  // Apply Filters
  const filterString = `
    brightness(${adjustments.brightness}%) 
    contrast(${adjustments.contrast}%) 
    saturate(${adjustments.saturation}%) 
    blur(${adjustments.blur}px) 
    grayscale(${adjustments.grayscale}%) 
    sepia(${adjustments.sepia}%)
  `;
  ctx.filter = filterString.trim();

  // Draw Image centered
  // We need to calculate aspect ratio to fit image in canvas if needed, 
  // but usually we set canvas size to image size.
  ctx.drawImage(img, 0, 0, width, height);
  
  ctx.restore();
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};