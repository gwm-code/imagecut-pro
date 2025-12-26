import { removeBackground, Config } from '@imgly/background-removal';

// Switching to Unpkg. 
// static.img.ly causes DNS errors for some users.
// JSDelivr sometimes fails directory lookups for this package.
// Unpkg mirrors the exact npm directory structure, ensuring resources.json is found.
const MODEL_ASSET_URL = 'https://unpkg.com/@imgly/background-removal-data@1.5.5/dist/';

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
      debug: true // Keep debug enabled to spot any further CDN issues
    };

    // The removeBackground function from the npm package handles everything
    const blob = await removeBackground(imageSrc, config);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    // Provide a more specific error message based on common issues
    if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error("Failed to download AI model. If you use an AdBlocker, try disabling it, or check your internet.");
    }
    throw new Error("Failed to remove background. Please try again.");
  }
};