

# Debug Plan: Chrome Extension Step Capture Not Working

## Problem Summary

After clicking "Start Recording" in the extension sidebar and interacting with a webpage, no steps are appearing. This indicates a breakdown in the communication chain between the **content script**, **background worker**, and **sidebar**.

---

## Root Cause Analysis

After reviewing the extension code, I've identified **two critical issues**:

### Issue 1: Content Script Not Receiving Recording State

The content script (`content-script.ts`) starts with `isRecording = false` and only updates this when it receives a `START_RECORDING` message. However, the `broadcastToTabs` function in the background worker may fail silently because:

- Content scripts might not be injected on pages loaded **before** the extension was installed/enabled
- The content script may not have been re-injected after the extension was loaded into Chrome

### Issue 2: Content Script Messaging Flow

When you click "Start Recording":
1. Sidebar sends `START_RECORDING` to background
2. Background calls `broadcastToTabs("START_RECORDING")` to notify content scripts
3. Content script should set `isRecording = true`
4. When you interact with the page, content script sends `CAPTURE_STEP` to background
5. Background creates the step and sends `STEP_CAPTURED` back to sidebar

**The problem**: If the content script wasn't injected on the current tab, or if the tab was opened before the extension was loaded, steps 3-5 never happen.

---

## Debugging Steps to Confirm

### Step 1: Check if Content Script is Loaded (User Action)

On the target webpage (e.g., Google Docs):
1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Look for: `[Opstrace] Content script loaded`

If you **don't see this message**, the content script isn't running on that page.

### Step 2: Check Background Script Console

1. Go to `chrome://extensions/`
2. Find "Opstrace SOP Creator"
3. Click **"Service worker"** link to open the background console
4. Look for messages like:
   - `[Opstrace] Background service worker started`
   - `[Background] Received message: START_RECORDING`

### Step 3: Verify Tab Communication

In the background console, after clicking "Start Recording", you should see:
- `[Background] Received message: START_RECORDING`

If you interact with a page and see **no** `CAPTURE_STEP` messages, the content script isn't communicating.

---

## Implementation Fixes

### Fix 1: Force Inject Content Script on Recording Start

Modify the `handleStartRecording` function in `background.ts` to programmatically inject the content script into the active tab, ensuring it's always present when recording starts.

```text
Location: extension/background.ts
Change: In handleStartRecording(), add chrome.scripting.executeScript() 
        to inject content script into active tab before broadcasting
```

### Fix 2: Add Content Script Injection Helper

Create a function that uses the `chrome.scripting` API to inject the content script dynamically:

```typescript
async function ensureContentScriptInjected(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/content-script.js"],
    });
  } catch (error) {
    // Script may already be injected, which throws an error
    console.log("[Background] Content script injection:", error);
  }
}
```

### Fix 3: Inject on Active Tab When Starting Recording

Update `handleStartRecording` to get the active tab and ensure the content script is injected:

```typescript
async function handleStartRecording(...) {
  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await ensureContentScriptInjected(tab.id);
  }
  
  // ... rest of recording logic
}
```

### Fix 4: Add Debug Logging

Add more detailed console logging to help trace issues:
- Log when content script receives messages
- Log when content script detects clicks/interactions
- Log the step payload being sent

---

## File Changes Summary

| File | Change |
|------|--------|
| `extension/background.ts` | Add `ensureContentScriptInjected()` helper and call it in `handleStartRecording()` |
| `extension/content/content-script.ts` | Add more verbose logging for debugging |

---

## Technical Details

### Why This Happens

Chrome's Manifest V3 content script injection has limitations:
- Content scripts declared in `manifest.json` only inject into **new tabs** opened after the extension loads
- Tabs that were already open when you loaded the extension (via "Load unpacked") don't get the content script automatically
- You must either reload those tabs or use `chrome.scripting.executeScript()` to inject dynamically

### The Fix Approach

By using `chrome.scripting.executeScript()` when recording starts, we guarantee the content script is present on the active tab regardless of when that tab was opened.

---

## Quick Test After Fix

1. Rebuild the extension: `npx vite build --config vite.config.extension.ts`
2. Copy icons: `cp -r extension/icons extension/dist/`
3. In `chrome://extensions/`, click the refresh icon on the extension
4. Open a new tab to any website
5. Open the sidebar and click "Start Recording"
6. Click on elements on the page
7. Steps should now appear in the sidebar

