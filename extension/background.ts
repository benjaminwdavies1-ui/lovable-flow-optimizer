// Background Service Worker - Message Hub and Screenshot Capture
import type {
  ExtensionMessage,
  RecordingSession,
  CapturedStep,
  CaptureStepPayload,
  StartRecordingPayload,
  ClickedElement,
  AuthState,
  STORAGE_KEYS,
} from "./shared/types";
import { broadcastToTabs, getActiveTab } from "./shared/messaging";

/**
 * Generate human-readable instruction from element info (inlined to avoid
 * sharing a chunk with the content script, which breaks code-splitting)
 */
function generateInstruction(actionType: string, element: ClickedElement): string {
  const elementText = element.text || "element";
  const tagName = element.tagName;

  switch (actionType) {
    case "click":
      if (tagName === "button") return `Click the "${elementText}" button`;
      if (tagName === "a") return `Click the "${elementText}" link`;
      if (tagName === "input" && element.type === "checkbox") return `Check the "${elementText}" checkbox`;
      if (tagName === "input" && element.type === "radio") return `Select the "${elementText}" option`;
      return `Click on "${elementText}"`;
    case "type": {
      const fieldName = element.text || element.placeholder || "field";
      return `Type in the "${fieldName}" field`;
    }
    case "navigate":
      return `Navigate to ${elementText}`;
    case "scroll":
      return `Scroll to view "${elementText}"`;
    default:
      return elementText ? `Interact with "${elementText}"` : "";
  }
}

// Current session state
let currentSession: RecordingSession | null = null;

/**
 * Ensure content script is injected into a tab
 */
async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/content-script.js"],
    });
    console.log("[Background] Content script injected into tab:", tabId);
    return true;
  } catch (error) {
    // Script may already be injected, or tab doesn't support injection
    console.log("[Background] Content script injection result:", error);
    return false;
  }
}

/**
 * Initialize the background service worker
 */
function init(): void {
  console.log("[Opstrace] Background service worker started");

  // Set up message listener
  chrome.runtime.onMessage.addListener(handleMessage);

  // Set up action click to open side panel
  chrome.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  });

  // Set side panel behavior
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

/**
 * Handle messages from content scripts and sidebar
 */
function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean {
  console.log("[Background] Received message:", message.type);

  switch (message.type) {
    case "START_RECORDING":
      handleStartRecording(message.payload as StartRecordingPayload, sendResponse);
      break;

    case "STOP_RECORDING":
      handleStopRecording(sendResponse);
      break;

    case "PAUSE_RECORDING":
      handlePauseRecording(sendResponse);
      break;

    case "RESUME_RECORDING":
      handleResumeRecording(sendResponse);
      break;

    case "CAPTURE_STEP":
      handleCaptureStep(message.payload as CaptureStepPayload, sender.tab?.id, sendResponse);
      break;

    case "GET_SESSION":
      sendResponse({ session: currentSession });
      break;

    case "CAPTURE_SCREENSHOT":
      handleCaptureScreenshot(sendResponse);
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true; // Keep channel open for async responses
}

/**
 * Start a new recording session
 */
async function handleStartRecording(
  payload: StartRecordingPayload,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    // Get active tab and inject content script first
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      console.log("[Background] Injecting content script into active tab:", tab.id, tab.url);
      await ensureContentScriptInjected(tab.id);
    } else {
      console.warn("[Background] No active tab found for content script injection");
    }

    currentSession = {
      id: crypto.randomUUID(),
      title: payload.title,
      startTime: Date.now(),
      steps: [],
      isRecording: true,
      isPaused: false,
    };

    // Notify all content scripts
    await broadcastToTabs("START_RECORDING", {});
    console.log("[Background] Recording started, broadcast sent to all tabs");

    // Store session
    await chrome.storage.local.set({ opstrace_session: currentSession });

    sendResponse({ success: true, session: currentSession });
  } catch (error) {
    console.error("[Background] Start recording error:", error);
    sendResponse({ error: "Failed to start recording" });
  }
}

/**
 * Stop the current recording
 */
async function handleStopRecording(
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    if (currentSession) {
      currentSession.isRecording = false;
      currentSession.isPaused = false;

      // Store final session
      await chrome.storage.local.set({ opstrace_session: currentSession });
    }

    // Notify all content scripts
    await broadcastToTabs("STOP_RECORDING", {});

    sendResponse({ success: true, session: currentSession });
  } catch (error) {
    console.error("[Background] Stop recording error:", error);
    sendResponse({ error: "Failed to stop recording" });
  }
}

/**
 * Pause the current recording
 */
async function handlePauseRecording(
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    if (currentSession) {
      currentSession.isPaused = true;
      await chrome.storage.local.set({ opstrace_session: currentSession });
    }

    await broadcastToTabs("PAUSE_RECORDING", {});
    sendResponse({ success: true });
  } catch (error) {
    console.error("[Background] Pause recording error:", error);
    sendResponse({ error: "Failed to pause recording" });
  }
}

/**
 * Resume the current recording
 */
async function handleResumeRecording(
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    if (currentSession) {
      currentSession.isPaused = false;
      await chrome.storage.local.set({ opstrace_session: currentSession });
    }

    await broadcastToTabs("RESUME_RECORDING", {});
    sendResponse({ success: true });
  } catch (error) {
    console.error("[Background] Resume recording error:", error);
    sendResponse({ error: "Failed to resume recording" });
  }
}

/**
 * Handle captured step from content script
 */
async function handleCaptureStep(
  payload: CaptureStepPayload,
  tabId: number | undefined,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    if (!currentSession || !currentSession.isRecording || currentSession.isPaused) {
      sendResponse({ error: "Not recording" });
      return;
    }

    // Generate instruction text
    const instructionText = payload.clickedElement
      ? generateInstruction(payload.actionType, payload.clickedElement)
      : `${payload.actionType} action`;

    // Create step
    const step: CapturedStep = {
      id: crypto.randomUUID(),
      orderNumber: currentSession.steps.length + 1,
      actionType: payload.actionType,
      instructionText,
      clickPosition: payload.clickPosition,
      clickedElement: payload.clickedElement,
      url: payload.url,
      timestamp: Date.now(),
      hasWarning: false,
      isRedacted: false,
    };

    // Capture screenshot
    if (tabId) {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab({
          format: "png",
          quality: 80,
        });

        step.screenshotDataUrl = dataUrl;
      } catch (screenshotError) {
        console.warn("[Background] Screenshot capture failed:", screenshotError);
      }
    }

    // Add to session
    currentSession.steps.push(step);
    await chrome.storage.local.set({ opstrace_session: currentSession });

    // Notify sidebar of new step
    chrome.runtime.sendMessage({
      type: "STEP_CAPTURED",
      payload: { step },
    });

    sendResponse({ success: true, step });
  } catch (error) {
    console.error("[Background] Capture step error:", error);
    sendResponse({ error: "Failed to capture step" });
  }
}

/**
 * Capture screenshot of active tab
 */
async function handleCaptureScreenshot(
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      sendResponse({ error: "No active tab" });
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
      quality: 80,
    });

    sendResponse({ success: true, dataUrl });
  } catch (error) {
    console.error("[Background] Screenshot error:", error);
    sendResponse({ error: "Failed to capture screenshot" });
  }
}

// Initialize when service worker starts
init();
