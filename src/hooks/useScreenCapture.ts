import { useCallback, useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

interface ClickPosition {
  x: number;
  y: number;
}

interface ClickedElement {
  text: string;
  tagName: string;
  type?: string;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

interface UseScreenCaptureReturn {
  captureScreen: () => Promise<string | null>;
  isCapturing: boolean;
  error: string | null;
  lastClickPosition: ClickPosition | null;
  lastClickedElement: ClickedElement | null;
  generateInstruction: (actionType: string) => string;
}

function getElementDescription(element: HTMLElement): ClickedElement {
  const tagName = element.tagName.toLowerCase();
  
  // Get meaningful text from the element
  let text = "";
  
  // For buttons and links, get the text content
  if (tagName === "button" || tagName === "a") {
    text = element.textContent?.trim() || "";
  }
  
  // For inputs, get placeholder or label
  if (tagName === "input" || tagName === "textarea") {
    const input = element as HTMLInputElement;
    text = input.placeholder || "";
    
    // Try to find associated label
    if (!text && input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        text = label.textContent?.trim() || "";
      }
    }
  }
  
  // For images, get alt text
  if (tagName === "img") {
    text = (element as HTMLImageElement).alt || "";
  }
  
  // Fallback to aria-label or title
  if (!text) {
    text = element.getAttribute("aria-label") || 
           element.getAttribute("title") || 
           element.textContent?.trim().slice(0, 50) || "";
  }
  
  return {
    text: text.replace(/\s+/g, " ").trim(),
    tagName,
    type: (element as HTMLInputElement).type,
    placeholder: (element as HTMLInputElement).placeholder,
    ariaLabel: element.getAttribute("aria-label") || undefined,
    id: element.id || undefined,
    className: element.className?.toString().slice(0, 100) || undefined,
  };
}

export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastClickPositionRef = useRef<ClickPosition | null>(null);
  const lastClickedElementRef = useRef<ClickedElement | null>(null);
  const [lastClickPosition, setLastClickPosition] = useState<ClickPosition | null>(null);
  const [lastClickedElement, setLastClickedElement] = useState<ClickedElement | null>(null);

  // Track clicks globally
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const position = { x: e.clientX, y: e.clientY };
      lastClickPositionRef.current = position;
      setLastClickPosition(position);
      
      // Capture element info
      const target = e.target as HTMLElement;
      if (target) {
        const elementInfo = getElementDescription(target);
        lastClickedElementRef.current = elementInfo;
        setLastClickedElement(elementInfo);
      }
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  const generateInstruction = useCallback((actionType: string): string => {
    const element = lastClickedElementRef.current;
    if (!element) return "";
    
    const elementText = element.text || "element";
    const tagName = element.tagName;
    
    switch (actionType) {
      case "click":
        if (tagName === "button") {
          return `Click the "${elementText}" button`;
        } else if (tagName === "a") {
          return `Click the "${elementText}" link`;
        } else if (tagName === "input" && element.type === "checkbox") {
          return `Check the "${elementText}" checkbox`;
        } else if (tagName === "input" && element.type === "radio") {
          return `Select the "${elementText}" option`;
        } else {
          return `Click on "${elementText}"`;
        }
      
      case "type":
        if (tagName === "input" || tagName === "textarea") {
          const fieldName = element.text || element.placeholder || "field";
          return `Type in the "${fieldName}" field`;
        }
        return `Enter text in the ${elementText} field`;
      
      case "navigate":
        return `Navigate to the ${elementText} page`;
      
      case "scroll":
        return `Scroll to view "${elementText}"`;
      
      default:
        return elementText ? `Interact with "${elementText}"` : "";
    }
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

  return { 
    captureScreen, 
    isCapturing, 
    error, 
    lastClickPosition, 
    lastClickedElement,
    generateInstruction 
  };
}
