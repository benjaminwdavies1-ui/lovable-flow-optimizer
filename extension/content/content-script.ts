// Content Script - Injected into target pages
import type { ExtensionMessage, CaptureStepPayload, ActionType } from "../shared/types";
import {
  getElementDescription,
  getClickPosition,
  detectActionType,
  generateInstruction,
} from "./click-tracker";

let isRecording = false;
let isContinuousMode = false;
let lastClickPosition: { x: number; y: number } | null = null;

/**
 * Initialize the content script
 */
function init(): void {
  console.log("[Opstrace] Content script loaded on:", window.location.href);

  chrome.runtime.onMessage.addListener(handleMessage);
  setupEventListeners();
  console.log("[Opstrace] Event listeners attached - ready to capture interactions");

  // Check if a recording or continuous mode is already in progress
  chrome.storage.local.get(["opstrace_session", "opstrace_continuous"]).then((result) => {
    const session = result.opstrace_session;
    if (session?.isRecording && !session.isPaused) {
      console.log("[Opstrace] Recording already active on init - enabling capture");
      isRecording = true;
      showRecordingIndicator();
    }

    const continuous = result.opstrace_continuous;
    if (continuous?.enabled) {
      console.log("[Opstrace] Continuous mode active on init");
      isContinuousMode = true;
      if (!isRecording) {
        showContinuousIndicator();
      }
    }
  });
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
      hideContinuousIndicator();
      showRecordingIndicator();
      sendResponse({ success: true });
      break;

    case "STOP_RECORDING":
      isRecording = false;
      hideRecordingIndicator();
      if (isContinuousMode) showContinuousIndicator();
      sendResponse({ success: true });
      break;

    case "PAUSE_RECORDING":
      isRecording = false;
      updateRecordingIndicator("paused");
      sendResponse({ success: true });
      break;

    case "RESUME_RECORDING":
      isRecording = true;
      updateRecordingIndicator("recording");
      sendResponse({ success: true });
      break;

    case "TOGGLE_CONTINUOUS" as any:
      isContinuousMode = (message.payload as any)?.enabled ?? false;
      if (isContinuousMode && !isRecording) {
        showContinuousIndicator();
      } else if (!isContinuousMode) {
        hideContinuousIndicator();
      }
      sendResponse({ success: true });
      break;

    default:
      break;
  }

  return true;
}

/**
 * Set up DOM event listeners
 */
function setupEventListeners(): void {
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("scroll", handleScroll, { passive: true });
}

/**
 * Handle click events
 */
function handleClick(event: MouseEvent): void {
  const shouldCapture = isRecording || isContinuousMode;
  if (!shouldCapture) return;

  const target = event.target as HTMLElement;
  if (!target || isIndicatorElement(target)) return;

  lastClickPosition = getClickPosition(event);
  const elementInfo = getElementDescription(target);
  const actionType = detectActionType(target);

  const payload: CaptureStepPayload = {
    actionType,
    clickPosition: lastClickPosition,
    clickedElement: elementInfo,
    url: window.location.href,
  };

  // Send to manual recording
  if (isRecording) {
    chrome.runtime.sendMessage({ type: "CAPTURE_STEP", payload });
  }

  // Send to continuous monitoring (always, even during recording)
  if (isContinuousMode) {
    chrome.runtime.sendMessage({ type: "CONTINUOUS_CAPTURE", payload });
  }

  showClickFeedback(lastClickPosition);
}

/**
 * Handle keyboard events
 */
function handleKeydown(event: KeyboardEvent): void {
  const shouldCapture = isRecording || isContinuousMode;
  if (!shouldCapture) return;

  const target = event.target as HTMLElement;
  if (!target) return;

  const tagName = target.tagName.toLowerCase();
  if (tagName !== "input" && tagName !== "textarea" && !target.isContentEditable) {
    return;
  }

  if (event.key === "Enter") {
    const elementInfo = getElementDescription(target);
    const payload: CaptureStepPayload = {
      actionType: "type" as ActionType,
      clickedElement: elementInfo,
      url: window.location.href,
    };

    if (isRecording) {
      chrome.runtime.sendMessage({ type: "CAPTURE_STEP", payload });
    }
    if (isContinuousMode) {
      chrome.runtime.sendMessage({ type: "CONTINUOUS_CAPTURE", payload });
    }
  }
}

/**
 * Handle scroll events (debounced)
 */
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
function handleScroll(): void {
  const shouldCapture = isRecording || isContinuousMode;
  if (!shouldCapture) return;

  if (scrollTimeout) clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    const payload: CaptureStepPayload = {
      actionType: "scroll" as ActionType,
      url: window.location.href,
    };

    if (isRecording) {
      chrome.runtime.sendMessage({ type: "CAPTURE_STEP", payload });
    }
    if (isContinuousMode) {
      chrome.runtime.sendMessage({ type: "CONTINUOUS_CAPTURE", payload });
    }
  }, 1000);
}

// ==================== Indicators ====================

function showRecordingIndicator(): void {
  let indicator = document.getElementById("opstrace-recording-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "opstrace-recording-indicator";
    indicator.innerHTML = `
      <div style="
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        display: flex; align-items: center; gap: 8px; padding: 8px 16px;
        background: rgba(239, 68, 68, 0.95); color: white; border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); pointer-events: none;
      ">
        <span style="width: 8px; height: 8px; background: white; border-radius: 50%;
          animation: opstrace-pulse 1.5s ease-in-out infinite;"></span>
        <span id="opstrace-indicator-text">Recording</span>
      </div>
      <style>
        @keyframes opstrace-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      </style>
    `;
    document.body.appendChild(indicator);
  }
}

function updateRecordingIndicator(state: "recording" | "paused"): void {
  const text = document.getElementById("opstrace-indicator-text");
  if (text) text.textContent = state === "recording" ? "Recording" : "Paused";
}

function hideRecordingIndicator(): void {
  document.getElementById("opstrace-recording-indicator")?.remove();
}

function showContinuousIndicator(): void {
  let dot = document.getElementById("opstrace-continuous-indicator");
  if (!dot) {
    dot = document.createElement("div");
    dot.id = "opstrace-continuous-indicator";
    dot.innerHTML = `
      <div style="
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        width: 12px; height: 12px; background: rgba(34, 197, 94, 0.9);
        border-radius: 50%; pointer-events: none;
        box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
        animation: opstrace-continuous-pulse 3s ease-in-out infinite;
      "></div>
      <style>
        @keyframes opstrace-continuous-pulse {
          0%, 100% { opacity: 0.9; } 50% { opacity: 0.4; }
        }
      </style>
    `;
    document.body.appendChild(dot);
  }
}

function hideContinuousIndicator(): void {
  document.getElementById("opstrace-continuous-indicator")?.remove();
}

function isIndicatorElement(element: HTMLElement): boolean {
  return (
    element.id === "opstrace-recording-indicator" ||
    element.id === "opstrace-continuous-indicator" ||
    element.closest("#opstrace-recording-indicator") !== null ||
    element.closest("#opstrace-continuous-indicator") !== null
  );
}

function showClickFeedback(position: { x: number; y: number }): void {
  const feedback = document.createElement("div");
  feedback.style.cssText = `
    position: fixed; left: ${position.x}px; top: ${position.y}px;
    width: 24px; height: 24px; margin-left: -12px; margin-top: -12px;
    border: 2px solid rgba(239, 68, 68, 0.8); border-radius: 50%;
    pointer-events: none; z-index: 2147483646;
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
