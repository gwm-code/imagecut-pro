import { removeBackground, Config } from '@imgly/background-removal';

export const removeBackgroundAI = async (
    imageSrc: string,
    onProgress?: (progress: number, message: string) => void
): Promise<string> => {
  try {
    // We are serving the assets locally from /assets/model-data/ 
    // This assumes vite-plugin-static-copy moved them there during build.
    // This solves all CORS, 404, and Version Mismatch errors.
    const publicPath = `${window.location.origin}/assets/model-data/`;

    const config: Config = {
      publicPath: publicPath,
      // The library calls this function as it downloads different model chunks
      progress: (key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
           const percent = Math.round((current / total) * 100);
           const niceName = key.split('/').pop() || 'Model assets';
           onProgress(percent, `Loading ${niceName}...`);
        }
      },
      debug: true,
      fetchArgs: {
        mode: 'no-cors' // Extra safety for local fetching
      }
    };

    const blob = await removeBackground(imageSrc, config);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("AI Removal Failed:", error);
    throw new Error("Failed to process image. Please try again.");
  }
};