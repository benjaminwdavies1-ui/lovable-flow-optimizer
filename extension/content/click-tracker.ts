// DOM Event Capture Logic for Content Script
import type { ClickedElement, ClickPosition } from "../shared/types";

/**
 * Generate a unique CSS selector for an element
 */
export function generateSelector(element: HTMLElement): string {
  // Try ID first
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Build path from element to root
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add classes for specificity
    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => c && !c.startsWith("hover") && !c.startsWith("focus"))
        .slice(0, 2)
        .map((c) => `.${CSS.escape(c)}`)
        .join("");
      selector += classes;
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

/**
 * Extract meaningful text from an element
 */
function getElementText(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();

  // For buttons and links, get text content
  if (tagName === "button" || tagName === "a") {
    return element.textContent?.trim().slice(0, 100) || "";
  }

  // For inputs, get placeholder or label
  if (tagName === "input" || tagName === "textarea") {
    const input = element as HTMLInputElement;
    let text = input.placeholder || "";

    // Try to find associated label
    if (!text && input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        text = label.textContent?.trim() || "";
      }
    }

    // Try aria-label
    if (!text) {
      text = input.getAttribute("aria-label") || "";
    }

    return text.slice(0, 100);
  }

  // For images, get alt text
  if (tagName === "img") {
    return (element as HTMLImageElement).alt || "";
  }

  // Fallback to aria-label, title, or text content
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent?.trim().slice(0, 50) ||
    ""
  );
}

/**
 * Extract comprehensive element information
 */
export function getElementDescription(element: HTMLElement): ClickedElement {
  const tagName = element.tagName.toLowerCase();
  const text = getElementText(element);

  return {
    text: text.replace(/\s+/g, " ").trim(),
    tagName,
    type: (element as HTMLInputElement).type || undefined,
    placeholder: (element as HTMLInputElement).placeholder || undefined,
    ariaLabel: element.getAttribute("aria-label") || undefined,
    id: element.id || undefined,
    className: element.className?.toString().slice(0, 100) || undefined,
    selector: generateSelector(element),
  };
}

/**
 * Get click position relative to viewport
 */
export function getClickPosition(event: MouseEvent): ClickPosition {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Detect action type based on element
 */
export function detectActionType(
  element: HTMLElement
): "click" | "type" | "navigate" | "scroll" {
  const tagName = element.tagName.toLowerCase();

  // Input fields suggest typing
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    element.isContentEditable
  ) {
    const inputType = (element as HTMLInputElement).type;
    // Checkboxes and radios are clicks
    if (inputType === "checkbox" || inputType === "radio" || inputType === "submit") {
      return "click";
    }
    return "type";
  }

  // Links might be navigation
  if (tagName === "a") {
    const href = (element as HTMLAnchorElement).href;
    // External links or same-page anchors
    if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      return "navigate";
    }
  }

  // Default to click
  return "click";
}

/**
 * Generate human-readable instruction from element info
 */
export function generateInstruction(
  actionType: string,
  element: ClickedElement
): string {
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
      const fieldName = element.text || element.placeholder || "field";
      return `Type in the "${fieldName}" field`;

    case "navigate":
      return `Navigate to ${elementText}`;

    case "scroll":
      return `Scroll to view "${elementText}"`;

    default:
      return elementText ? `Interact with "${elementText}"` : "";
  }
}

/**
 * Draw click indicator on a canvas
 */
export function drawClickIndicator(
  ctx: CanvasRenderingContext2D,
  position: ClickPosition,
  scale: number = 1
): void {
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
}
