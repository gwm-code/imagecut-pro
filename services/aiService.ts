import { removeBackground, Config } from '@imgly/background-removal';

// Using the official static.img.ly CDN which is more reliable for these assets than JSDelivr.
// We are pinning to version 1.3.0 which is known to have a stable directory structure.
const MODEL_ASSET_URL = 'https://static.img.ly/background-removal-data/1.3.0/dist/';

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
      debug: true // Enable debug to help trace issues in console if they occur
    };

    // The removeBackground function from the npm package handles everything
    const blob = await removeBackground(imageSrc, config);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    throw new Error("Failed to remove background. Please check your internet connection and try again.");
  }
};