import { useCallback, useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

interface ClickPosition {
  x: number;
  y: number;
}

interface UseScreenCaptureReturn {
  captureScreen: () => Promise<string | null>;
  isCapturing: boolean;
  error: string | null;
  lastClickPosition: ClickPosition | null;
}

export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastClickPositionRef = useRef<ClickPosition | null>(null);
  const [lastClickPosition, setLastClickPosition] = useState<ClickPosition | null>(null);

  // Track clicks globally
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const position = { x: e.clientX, y: e.clientY };
      lastClickPositionRef.current = position;
      setLastClickPosition(position);
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  const drawClickIndicator = useCallback((
    canvas: HTMLCanvasElement, 
    position: ClickPosition,
    scale: number
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaledX = position.x * scale;
    const scaledY = position.y * scale;
    const outerRadius = 24 * scale;
    const innerRadius = 8 * scale;

    // Outer ring with glow
    ctx.save();
    ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 3 * scale;
    ctx.stroke();
    ctx.restore();

    // Inner filled circle
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
    ctx.fill();

    // White center dot
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, 3 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }, []);

  const captureScreen = useCallback(async (): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    // Small delay to ensure click position is captured
    await new Promise(resolve => setTimeout(resolve, 50));

    const clickPos = lastClickPositionRef.current;

    try {
      const scale = 0.5;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale,
        logging: false,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Draw click indicator if we have a position
      if (clickPos) {
        drawClickIndicator(canvas, clickPos, scale);
      }

      const dataUrl = canvas.toDataURL("image/png", 0.7);
      setIsCapturing(false);
      return dataUrl;
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      setError("Failed to capture screenshot");
      setIsCapturing(false);
      return null;
    }
  }, [drawClickIndicator]);

  return { captureScreen, isCapturing, error, lastClickPosition };
}
