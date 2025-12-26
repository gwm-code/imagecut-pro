export interface Adjustments {
  brightness: number; // 100 is default
  contrast: number;   // 100 is default
  saturation: number; // 100 is default
  blur: number;       // 0 is default
  grayscale: number;  // 0 is default
  sepia: number;      // 0 is default
  rotation: number;   // 0 degrees
}

export type ActiveTool = 'adjust' | 'filters' | 'remove-bg' | 'crop';

export interface EditorState {
  imageSrc: string | null;
  processedImageSrc: string | null; // For result of BG removal
  isProcessing: boolean;
  history: Adjustments[];
  currentHistoryIndex: number;
}