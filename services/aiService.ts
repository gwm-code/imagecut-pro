import { removeBackground } from "@imgly/background-removal";

// Ensure we point to the correct version of the data assets
const MODEL_ASSET_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.5.0/dist/';

export const removeBackgroundAI = async (imageSrc: string): Promise<string> => {
  try {
    // 1. Convert Data URI to Blob
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    // 2. Run AI Removal
    // The library needs to fetch model files (approx 20-40MB total)
    // We set publicPath to the CDN hosting these files.
    const resultBlob = await removeBackground(blob, {
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
    throw new Error("Failed to remove background. Please check your internet connection.");
  }
};
