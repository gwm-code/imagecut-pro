import { removeBackground, Config } from '@imgly/background-removal';

// We are using version 1.3.0.
// This URL points to the assets specifically for version 1.3.0 on JSDelivr.
// JSDelivr is generally reliable for CORS and directory structure for this specific version.
const MODEL_ASSET_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.3.0/dist/';

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
      debug: true // Enable debug to help trace issues in console
    };

    // The removeBackground function from the npm package handles everything
    const blob = await removeBackground(imageSrc, config);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    
    // Check for common specific errors
    if (error instanceof Error) {
        if (error.message.includes('fetch')) {
             throw new Error("Connection failed. This model requires internet access to download resources. Please check your connection or ad-blockers.");
        }
        if (error.message.includes('404')) {
             throw new Error("Model resources not found. Please try refreshing the page.");
        }
    }
    
    throw new Error("Failed to remove background. Please try again.");
  }
};