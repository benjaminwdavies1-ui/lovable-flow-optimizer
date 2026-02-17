
## Fix Screen Recording to Capture Screenshots on Clicks

### The Problem

The "Screen Capture" button on the Create SOP page (`/sops/new`) currently only opens the browser's screen picker and shows a toast. It does NOT:
- Actually record the screen stream
- Capture screenshot frames when the user clicks
- Save those frames as SOP steps
- Create a recording in the database

### The Solution

Build a proper screen recording flow using the browser's `getDisplayMedia` API that captures a screenshot frame from the video stream every time the user clicks during recording.

### How It Will Work

1. User clicks "Screen Capture" -- browser shows the screen/window picker
2. A floating recording toolbar appears at the bottom of the screen with a timer, step count, and Stop button
3. The video stream plays in a hidden `<video>` element
4. Every time the user clicks anywhere on the shared screen/window, the system:
   - Draws the current video frame onto a hidden `<canvas>`
   - Converts it to a PNG data URL
   - Creates a new SOP step with the screenshot and auto-generated instruction text
5. When the user clicks "Stop Recording" (or stops sharing via the browser UI), the recording ends and all captured steps populate the SOP editor below

### Technical Changes

#### 1. Create `src/hooks/useScreenRecording.ts`

A new hook that manages the full screen recording lifecycle:
- Calls `navigator.mediaDevices.getDisplayMedia()` directly in the click handler (required by browser security)
- Stores the `MediaStream` in a ref
- Renders stream to a hidden `<video>` element
- Listens for `mousedown` events on the document during recording
- On each click, captures the current video frame via `<canvas>.drawImage(video)`
- Tracks recording state: `idle`, `recording`, `stopped`
- Returns: `startRecording()`, `stopRecording()`, `isRecording`, `capturedSteps[]`, `elapsedTime`

#### 2. Update `src/pages/SOPNew.tsx`

- Import and use the new `useScreenRecording` hook
- Wire the "Screen Capture" button to `startRecording()`
- Show a floating recording indicator bar when recording is active (red dot, timer, step count, stop button)
- When recording stops, auto-populate the SOP steps list with the captured screenshots and instructions
- Each captured step shows its screenshot thumbnail, order number, and editable title/description
- Optionally save the recording + steps to the database via `recordingService`

#### 3. Create `src/components/recording/RecordingToolbar.tsx`

A floating toolbar component shown during active recording:
- Fixed position at bottom center of screen
- Shows: red pulsing dot, elapsed time, step count, "Stop Recording" button
- Semi-transparent dark background so it doesn't obstruct the view

### What Users Will See

1. Click "Screen Capture" on the Create SOP page
2. Browser asks which screen/window/tab to share
3. A floating bar appears: "Recording... 00:32 | 5 steps captured | [Stop]"
4. Every click automatically captures a screenshot frame from the shared screen
5. Clicking Stop populates the SOP with all captured steps + screenshots
6. User can edit titles, descriptions, reorder, and publish

### Files Changed

| File | Action |
|------|--------|
| `src/hooks/useScreenRecording.ts` | Create -- core recording logic |
| `src/components/recording/RecordingToolbar.tsx` | Create -- floating UI during recording |
| `src/pages/SOPNew.tsx` | Update -- wire up recording flow and populate steps |

### Notes

- No database schema changes needed -- the existing `recordings` and `steps` tables already support this
- No new backend functions needed
- Screenshots are captured as data URLs in memory; they can be uploaded to storage when the SOP is saved
- The `getDisplayMedia` call is made directly in the button's `onClick` handler to satisfy browser security requirements
