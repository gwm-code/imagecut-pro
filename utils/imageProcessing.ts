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

export const performMagicWand = (
  img: HTMLImageElement,
  startX: number,
  startY: number,
  tolerance: number = 32
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Get start color
  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // If clicking on already transparent area, do nothing
  if (startA === 0) return canvas.toDataURL();

  const toleranceSq = tolerance * tolerance * 3; // Scaling tolerance for RGB euclidean dist approx

  const stack = [[startX, startY]];
  // Use a Uint8Array for visited to be safe against loops if we don't set alpha to 0 immediately or if logic changes
  // But setting alpha to 0 is enough for "visited" check if we treat alpha=0 as boundary.
  
  // Optimization: Pre-calculate indices to avoid repeated math
  while (stack.length) {
    const pop = stack.pop();
    if (!pop) break;
    const [x, y] = pop;

    const pos = (y * width + x) * 4;
    
    // Check boundaries/visited state via alpha
    if (data[pos + 3] === 0) continue;

    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];

    const diff = 
      (r - startR) * (r - startR) + 
      (g - startG) * (g - startG) + 
      (b - startB) * (b - startB);

    if (diff <= toleranceSq) {
      data[pos + 3] = 0; // Erase

      if (x > 0) stack.push([x - 1, y]);
      if (x < width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < height - 1) stack.push([x, y + 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};