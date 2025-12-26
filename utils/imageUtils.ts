import { ImageAdjustments, FilterType } from '../types';

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const applyFilterPreset = (r: number, g: number, b: number, type: FilterType): [number, number, number] => {
  switch (type) {
    case FilterType.GRAYSCALE: {
      const v = 0.299 * r + 0.587 * g + 0.114 * b;
      return [v, v, v];
    }
    case FilterType.SEPIA: {
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      return [tr, tg, tb];
    }
    case FilterType.INVERT: {
      return [255 - r, 255 - g, 255 - b];
    }
    case FilterType.VINTAGE: {
      // Simple warm tint + slight desaturation
      const tr = r * 1.2;
      const tg = g * 1.1;
      const tb = b * 0.9;
      return [tr, tg, tb];
    }
    case FilterType.KODACHROME: {
      // High contrast, warm
      const tr = (r - 128) * 1.5 + 128 + 20;
      const tg = (g - 128) * 1.5 + 128;
      const tb = (b - 128) * 1.5 + 128 - 20;
      return [tr, tg, tb];
    }
    case FilterType.TECHNICOLOR: {
      // Simulate 2-strip technicolor (red and cyan mostly)
      const tr = r;
      const tg = (g + b) / 2;
      const tb = (g + b) / 2;
      return [tr, tg, tb];
    }
    default:
      return [r, g, b];
  }
};

export const applyFilters = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: ImageAdjustments,
  activeFilter: FilterType
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const { brightness, contrast, saturation } = adjustments;

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Apply Preset Filter first (changes base color)
    if (activeFilter !== FilterType.NONE) {
        [r, g, b] = applyFilterPreset(r, g, b, activeFilter);
    }

    // 2. Adjustments
    // Brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Saturation
    if (saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satMult = 1 + (saturation / 100);
        r = gray + (r - gray) * satMult;
        g = gray + (g - gray) * satMult;
        b = gray + (b - gray) * satMult;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imageData, 0, 0);
};

export const removeColorRange = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  targetColor: { r: number, g: number, b: number },
  tolerance: number
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const distance = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
      Math.pow(g - targetColor.g, 2) +
      Math.pow(b - targetColor.b, 2)
    );

    if (distance < tolerance) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

export const transformImage = async (
  src: string,
  type: 'ROTATE_90' | 'FLIP_H' | 'FLIP_V'
): Promise<string> => {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return src;

    if (type === 'ROTATE_90') {
        canvas.width = img.height;
        canvas.height = img.width;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
    } else if (type === 'FLIP_H') {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.translate(img.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
    } else if (type === 'FLIP_V') {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.translate(0, img.height);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0);
    }

    return canvas.toDataURL('image/png');
};

export const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
