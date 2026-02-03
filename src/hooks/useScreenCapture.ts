import { useCallback, useState } from "react";
import html2canvas from "html2canvas";

interface UseScreenCaptureReturn {
  captureScreen: () => Promise<string | null>;
  isCapturing: boolean;
  error: string | null;
}

export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureScreen = useCallback(async (): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      // Capture the document body
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce size for performance
        logging: false,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png", 0.7);
      setIsCapturing(false);
      return dataUrl;
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      setError("Failed to capture screenshot");
      setIsCapturing(false);
      return null;
    }
  }, []);

  return { captureScreen, isCapturing, error };
}
