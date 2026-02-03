// Chrome Extension Messaging Utilities
import type { ExtensionMessage, MessageType } from "./types";

/**
 * Send a message to the background service worker
 */
export async function sendToBackground<T = unknown, R = unknown>(
  type: MessageType,
  payload?: T
): Promise<R | undefined> {
  try {
    const message: ExtensionMessage<T> = { type, payload };
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error("[Messaging] Error sending to background:", error);
    return undefined;
  }
}

/**
 * Send a message to a specific tab's content script
 */
export async function sendToTab<T = unknown, R = unknown>(
  tabId: number,
  type: MessageType,
  payload?: T
): Promise<R | undefined> {
  try {
    const message: ExtensionMessage<T> = { type, payload, tabId };
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error("[Messaging] Error sending to tab:", tabId, error);
    return undefined;
  }
}

/**
 * Send a message to all tabs
 */
export async function broadcastToTabs<T = unknown>(
  type: MessageType,
  payload?: T
): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const message: ExtensionMessage<T> = { type, payload };
    
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab might not have content script injected
        });
      }
    }
  } catch (error) {
    console.error("[Messaging] Error broadcasting to tabs:", error);
  }
}

/**
 * Create a message listener with type safety
 */
export function createMessageListener(
  handler: (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void
): void {
  chrome.runtime.onMessage.addListener(handler);
}

/**
 * Get current active tab
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error("[Messaging] Error getting active tab:", error);
    return undefined;
  }
}
