// Content Script - Injected into target pages
import type { ExtensionMessage, CaptureStepPayload, ActionType } from "../shared/types";
import {
  getElementDescription,
  getClickPosition,
  detectActionType,
  generateInstruction,
} from "./click-tracker";

let isRecording = false;
let lastClickPosition: { x: number; y: number } | null = null;

/**
 * Initialize the content script
 */
function init(): void {
  console.log("[Opstrace] Content script loaded on:", window.location.href);

  // Listen for messages from background/sidebar
  chrome.runtime.onMessage.addListener(handleMessage);

  // Set up event listeners
  setupEventListeners();
  console.log("[Opstrace] Event listeners attached - ready to capture interactions");
}

/**
 * Handle messages from background worker
 */
function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean {
  console.log("[Opstrace] Received message:", message.type);
  
  switch (message.type) {
    case "START_RECORDING":
      isRecording = true;
      console.log("[Opstrace] Recording STARTED - now capturing interactions");
      showRecordingIndicator();
      sendResponse({ success: true });
      break;

    case "STOP_RECORDING":
      isRecording = false;
      console.log("[Opstrace] Recording STOPPED");
      hideRecordingIndicator();
      sendResponse({ success: true });
      break;

    case "PAUSE_RECORDING":
      isRecording = false;
      console.log("[Opstrace] Recording PAUSED");
      updateRecordingIndicator("paused");
      sendResponse({ success: true });
      break;

    case "RESUME_RECORDING":
      isRecording = true;
      console.log("[Opstrace] Recording RESUMED");
      updateRecordingIndicator("recording");
      sendResponse({ success: true });
      break;

    default:
      break;
  }

  return true; // Keep message channel open for async response
}

/**
 * Set up DOM event listeners
 */
function setupEventListeners(): void {
  // Capture clicks
  document.addEventListener("click", handleClick, true);

  // Capture keyboard input (for detecting typing)
  document.addEventListener("keydown", handleKeydown, true);

  // Capture scroll
  document.addEventListener("scroll", handleScroll, { passive: true });
}

/**
 * Handle click events
 */
function handleClick(event: MouseEvent): void {
  console.log("[Opstrace] Click detected, isRecording:", isRecording);
  
  if (!isRecording) return;

  const target = event.target as HTMLElement;
  if (!target || isRecordingIndicator(target)) return;

  lastClickPosition = getClickPosition(event);
  const elementInfo = getElementDescription(target);
  const actionType = detectActionType(target);

  console.log("[Opstrace] Capturing click:", { actionType, elementInfo, url: window.location.href });

  // Send captured step to background
  const payload: CaptureStepPayload = {
    actionType,
    clickPosition: lastClickPosition,
    clickedElement: elementInfo,
    url: window.location.href,
  };

  chrome.runtime.sendMessage({
    type: "CAPTURE_STEP",
    payload,
  });

  // Visual feedback
  showClickFeedback(lastClickPosition);
}

/**
 * Handle keyboard events
 */
function handleKeydown(event: KeyboardEvent): void {
  if (!isRecording) return;

  const target = event.target as HTMLElement;
  if (!target) return;

  // Only capture on input fields
  const tagName = target.tagName.toLowerCase();
  if (tagName !== "input" && tagName !== "textarea" && !target.isContentEditable) {
    return;
  }

  // Debounce typing - only capture on Enter or after pause
  if (event.key === "Enter") {
    const elementInfo = getElementDescription(target);

    const payload: CaptureStepPayload = {
      actionType: "type" as ActionType,
      clickedElement: elementInfo,
      url: window.location.href,
    };

    chrome.runtime.sendMessage({
      type: "CAPTURE_STEP",
      payload,
    });
  }
}

/**
 * Handle scroll events (debounced)
 */
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
function handleScroll(): void {
  if (!isRecording) return;

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    // Only capture significant scrolls
    const payload: CaptureStepPayload = {
      actionType: "scroll" as ActionType,
      url: window.location.href,
    };

    chrome.runtime.sendMessage({
      type: "CAPTURE_STEP",
      payload,
    });
  }, 1000); // Wait 1 second after scroll stops
}

/**
 * Show recording indicator on page
 */
function showRecordingIndicator(): void {
  let indicator = document.getElementById("opstrace-recording-indicator");

  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "opstrace-recording-indicator";
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(239, 68, 68, 0.95);
        color: white;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        pointer-events: none;
      ">
        <span style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: opstrace-pulse 1.5s ease-in-out infinite;
        "></span>
        <span id="opstrace-indicator-text">Recording</span>
      </div>
      <style>
        @keyframes opstrace-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      </style>
    `;
    document.body.appendChild(indicator);
  }
}

/**
 * Update recording indicator state
 */
function updateRecordingIndicator(state: "recording" | "paused"): void {
  const text = document.getElementById("opstrace-indicator-text");
  if (text) {
    text.textContent = state === "recording" ? "Recording" : "Paused";
  }
}

/**
 * Hide recording indicator
 */
function hideRecordingIndicator(): void {
  const indicator = document.getElementById("opstrace-recording-indicator");
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Check if element is part of recording indicator
 */
function isRecordingIndicator(element: HTMLElement): boolean {
  return (
    element.id === "opstrace-recording-indicator" ||
    element.closest("#opstrace-recording-indicator") !== null
  );
}

/**
 * Show visual feedback for click
 */
function showClickFeedback(position: { x: number; y: number }): void {
  const feedback = document.createElement("div");
  feedback.style.cssText = `
    position: fixed;
    left: ${position.x}px;
    top: ${position.y}px;
    width: 24px;
    height: 24px;
    margin-left: -12px;
    margin-top: -12px;
    border: 2px solid rgba(239, 68, 68, 0.8);
    border-radius: 50%;
    pointer-events: none;
    z-index: 2147483646;
    animation: opstrace-click-ripple 0.6s ease-out forwards;
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes opstrace-click-ripple {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
    style.remove();
  }, 600);
}

// Initialize when script loads
init();
