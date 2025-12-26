// Access the global variable exposed by the UMD script in index.html
declare global {
  interface Window {
    imglyRemoveBackground: (
      blob: Blob | string, 
      config: { 
        publicPath: string; 
        progress?: (key: string, current: number, total: number) => void 
      }
    ) => Promise<Blob>;
  }
}

// We point to the CDN for the heavy model assets (wasm, onnx, etc.)
const MODEL_ASSET_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.5.0/dist/';

export const removeBackgroundAI = async (imageSrc: string): Promise<string> => {
  // Check if the script loaded
  if (typeof window.imglyRemoveBackground !== 'function') {
    throw new Error("AI Library not loaded. Please refresh the page.");
  }

  try {
    // 1. Convert Data URI to Blob (Helper mainly for consistency, though lib accepts string too)
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    // 2. Run AI Removal using Global Function
    const resultBlob = await window.imglyRemoveBackground(blob, {
      publicPath: MODEL_ASSET_URL,
      progress: (key: string, current: number, total: number) => {
        const percent = Math.round((current / total) * 100);
        console.log(`Downloading ${key}: ${percent}%`);
      }
    });

    // 3. Return as Data URI
    return URL.createObjectURL(resultBlob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    throw new Error("Failed to remove background. Ensure you have an internet connection for the first run.");
  }
};
