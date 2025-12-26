export enum ToolType {
  ADJUST = 'ADJUST',
  REMOVE_BG = 'REMOVE_BG',
  FILTERS = 'FILTERS',
  TRANSFORM = 'TRANSFORM'
}

export enum FilterType {
  NONE = 'NONE',
  GRAYSCALE = 'GRAYSCALE',
  SEPIA = 'SEPIA',
  INVERT = 'INVERT',
  VINTAGE = 'VINTAGE',
  KODACHROME = 'KODACHROME',
  TECHNICOLOR = 'TECHNICOLOR'
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  blur: number;       // 0 to 20
}

export type ProcessingStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
