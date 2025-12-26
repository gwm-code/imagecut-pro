import { removeBackground, Config } from '@imgly/background-removal';

// Update to match the installed package version (1.5.5) to ensure assets (wasm, onnx, json) exist.
const MODEL_ASSET_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.5.5/dist/';

export const removeBackgroundAI = async (
    imageSrc: string,
    onProgress?: (progress: number, message: string) => void
): Promise<string> => {
  try {
    const config: Config = {
      publicPath: MODEL_ASSET_URL,
      // The library calls this function as it downloads different model chunks
      progress: (key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
           const percent = Math.round((current / total) * 100);
           // Clean up the key name for display
           const niceName = key.split('/').pop() || 'Model assets';
           onProgress(percent, `Downloading ${niceName}...`);
        }
      },
      debug: false // Set to true if you need to see library internal logs
    };

    // The removeBackground function from the npm package handles everything
    const blob = await removeBackground(imageSrc, config);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    throw new Error("Failed to remove background. Please check your internet connection and try again.");
  }
};