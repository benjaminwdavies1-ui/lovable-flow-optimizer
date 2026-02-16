// Background Service Worker - Message Hub and Screenshot Capture
import type {
  ExtensionMessage,
  RecordingSession,
  CapturedStep,
  CaptureStepPayload,
  StartRecordingPayload,
  ClickedElement,
  AuthState,
  ActivityEvent,
  STORAGE_KEYS,
} from "./shared/types";
import { broadcastToTabs, getActiveTab } from "./shared/messaging";
import { setAuthFromStorage, batchInsertActivityEvents } from "./shared/supabase";

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

// Continuous monitoring state
let continuousMode = false;
let continuousEventBatch: ActivityEvent[] = [];
let continuousFlushTimer: ReturnType<typeof setTimeout> | null = null;
let continuousEventCount = 0;
let continuousScreenshotCounter = 0;

const BATCH_FLUSH_INTERVAL = 30000; // 30 seconds
const BATCH_FLUSH_SIZE = 10;
const SCREENSHOT_EVERY_N = 5;

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

  // Restore continuous mode state
  chrome.storage.local.get("opstrace_continuous").then((result) => {
    if (result.opstrace_continuous?.enabled) {
      continuousMode = true;
      continuousEventCount = result.opstrace_continuous.eventCount || 0;
      startContinuousFlushTimer();
      console.log("[Background] Continuous mode restored, events today:", continuousEventCount);
    }
  });
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

    case "TOGGLE_CONTINUOUS":
      handleToggleContinuous(message.payload as { enabled: boolean; userId?: string }, sendResponse);
      break;

    case "CONTINUOUS_CAPTURE":
      handleContinuousCapture(message.payload as CaptureStepPayload, sender.tab?.id, sendResponse);
      break;

    case "CONTINUOUS_STATUS":
      sendResponse({ enabled: continuousMode, eventCount: continuousEventCount });
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      console.log("[Background] Injecting content script into active tab:", tab.id, tab.url);
      await ensureContentScriptInjected(tab.id);
    }

    currentSession = {
      id: crypto.randomUUID(),
      title: payload.title,
      startTime: Date.now(),
      steps: [],
      isRecording: true,
      isPaused: false,
    };

    await broadcastToTabs("START_RECORDING", {});
    console.log("[Background] Recording started, broadcast sent to all tabs");

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
      await chrome.storage.local.set({ opstrace_session: currentSession });
    }

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

    const instructionText = payload.clickedElement
      ? generateInstruction(payload.actionType, payload.clickedElement)
      : `${payload.actionType} action`;

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

    if (tabId) {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: "png", quality: 80 });
        step.screenshotDataUrl = dataUrl;
      } catch (screenshotError) {
        console.warn("[Background] Screenshot capture failed:", screenshotError);
      }
    }

    currentSession.steps.push(step);
    await chrome.storage.local.set({ opstrace_session: currentSession });

    chrome.runtime.sendMessage({ type: "STEP_CAPTURED", payload: { step } });
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
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: "png", quality: 80 });
    sendResponse({ success: true, dataUrl });
  } catch (error) {
    console.error("[Background] Screenshot error:", error);
    sendResponse({ error: "Failed to capture screenshot" });
  }
}

// ==================== Continuous Mode ====================

/**
 * Toggle continuous monitoring mode
 */
async function handleToggleContinuous(
  payload: { enabled: boolean; userId?: string },
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    continuousMode = payload.enabled;

    if (continuousMode) {
      // Reset daily counter if new day
      const today = new Date().toISOString().split("T")[0];
      const stored = await chrome.storage.local.get("opstrace_continuous");
      if (stored.opstrace_continuous?.date !== today) {
        continuousEventCount = 0;
      }

      await chrome.storage.local.set({
        opstrace_continuous: {
          enabled: true,
          userId: payload.userId,
          eventCount: continuousEventCount,
          date: today,
        },
      });

      startContinuousFlushTimer();

      // Notify content scripts
      await broadcastToTabs("TOGGLE_CONTINUOUS" as any, { enabled: true });
      console.log("[Background] Continuous mode ENABLED");
    } else {
      // Flush remaining events
      await flushContinuousEvents();
      stopContinuousFlushTimer();

      await chrome.storage.local.set({
        opstrace_continuous: { enabled: false, eventCount: continuousEventCount },
      });

      await broadcastToTabs("TOGGLE_CONTINUOUS" as any, { enabled: false });
      console.log("[Background] Continuous mode DISABLED");
    }

    sendResponse({ success: true, enabled: continuousMode, eventCount: continuousEventCount });
  } catch (error) {
    console.error("[Background] Toggle continuous error:", error);
    sendResponse({ error: "Failed to toggle continuous mode" });
  }
}

/**
 * Handle continuous capture event from content script
 */
async function handleContinuousCapture(
  payload: CaptureStepPayload,
  tabId: number | undefined,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  try {
    if (!continuousMode) {
      sendResponse({ error: "Continuous mode not active" });
      return;
    }

    continuousScreenshotCounter++;
    let screenshotUrl: string | undefined;

    // Capture screenshot every Nth event
    if (tabId && continuousScreenshotCounter % SCREENSHOT_EVERY_N === 0) {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 50 });
        // For continuous mode we skip uploading screenshots to save bandwidth;
        // just store data URL temporarily in the event for local reference
        screenshotUrl = dataUrl;
      } catch {
        // ignore screenshot failures
      }
    }

    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      action_type: payload.actionType,
      url: payload.url,
      element_info: payload.clickedElement
        ? {
            text: payload.clickedElement.text,
            tagName: payload.clickedElement.tagName,
            type: payload.clickedElement.type,
            selector: payload.clickedElement.selector,
          }
        : null,
      timestamp: Date.now(),
    };

    continuousEventBatch.push(event);
    continuousEventCount++;

    // Update stored count
    const stored = await chrome.storage.local.get("opstrace_continuous");
    await chrome.storage.local.set({
      opstrace_continuous: {
        ...stored.opstrace_continuous,
        eventCount: continuousEventCount,
      },
    });

    // Notify sidebar of updated count
    chrome.runtime.sendMessage({
      type: "CONTINUOUS_STATUS",
      payload: { enabled: true, eventCount: continuousEventCount },
    }).catch(() => {});

    // Flush if batch is full
    if (continuousEventBatch.length >= BATCH_FLUSH_SIZE) {
      await flushContinuousEvents();
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error("[Background] Continuous capture error:", error);
    sendResponse({ error: "Failed to capture continuous event" });
  }
}

/**
 * Flush batched continuous events to database
 */
async function flushContinuousEvents(): Promise<void> {
  if (continuousEventBatch.length === 0) return;

  const eventsToFlush = [...continuousEventBatch];
  continuousEventBatch = [];

  try {
    const stored = await chrome.storage.local.get("opstrace_continuous");
    const userId = stored.opstrace_continuous?.userId;
    if (!userId) {
      console.warn("[Background] No userId for continuous flush, events discarded");
      return;
    }

    await setAuthFromStorage();
    const success = await batchInsertActivityEvents(userId, eventsToFlush);
    if (success) {
      console.log(`[Background] Flushed ${eventsToFlush.length} continuous events`);
    } else {
      console.warn("[Background] Failed to flush events, re-queuing");
      continuousEventBatch.unshift(...eventsToFlush);
    }
  } catch (error) {
    console.error("[Background] Flush error:", error);
    continuousEventBatch.unshift(...eventsToFlush);
  }
}

function startContinuousFlushTimer(): void {
  stopContinuousFlushTimer();
  continuousFlushTimer = setInterval(() => {
    flushContinuousEvents();
  }, BATCH_FLUSH_INTERVAL);
}

function stopContinuousFlushTimer(): void {
  if (continuousFlushTimer) {
    clearInterval(continuousFlushTimer);
    continuousFlushTimer = null;
  }
}

// Initialize when service worker starts
init();
