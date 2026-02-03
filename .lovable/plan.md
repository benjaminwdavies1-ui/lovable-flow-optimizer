
# Chrome Extension Setup Plan for Opstrace SOP Creator

## Overview

This plan outlines how to transform the current web application into a Chrome extension with a sidebar interface for capturing SOPs directly while browsing any website. The extension will allow users to capture real browser interactions (clicks, typing, navigation) on any webpage and create professional SOPs.

## Architecture

```text
+------------------+     +--------------------+     +------------------+
|  Content Script  |     |   Background       |     |   Sidebar Panel  |
|  (Injected into  |---->|   Service Worker   |---->|   (React App)    |
|   target pages)  |     |   (Message Hub)    |     |                  |
+------------------+     +--------------------+     +------------------+
        |                         |                         |
        v                         v                         v
   - DOM Events              - Tab Management           - Recording UI
   - Click Detection         - Message Routing          - Step List
   - Screenshot API          - Storage API              - SOP Editor
   - Element Info            - Auth State               - Supabase Sync
```

## Project Structure Changes

New files to be created:

```text
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── background.ts              # Service worker for message routing
├── content/
│   ├── content-script.ts      # Injected into target pages
│   └── click-tracker.ts       # DOM event capture logic
├── sidebar/
│   ├── index.html             # Sidebar HTML entry
│   ├── main.tsx               # Sidebar React app entry
│   └── SidebarApp.tsx         # Root component for sidebar
└── shared/
    ├── types.ts               # Shared TypeScript types
    └── messaging.ts           # Chrome messaging utilities
```

## Implementation Details

### Phase 1: Extension Foundation

**1.1 Create manifest.json**
- Manifest V3 format (required for Chrome Web Store)
- Permissions: `activeTab`, `storage`, `sidePanel`, `scripting`, `tabs`
- Content scripts auto-injected into all pages
- Side panel configuration for the recording UI

**1.2 Background Service Worker**
- Handles message passing between content script and sidebar
- Manages extension state (is recording active, current session)
- Coordinates tab switching during recording
- Stores temporary data using `chrome.storage.local`

**1.3 Content Script**
- Injected into every page the user visits
- Captures:
  - Click events with coordinates and element info
  - Keyboard input (for "type" actions)
  - URL changes (for navigation tracking)
  - Scroll positions
- Takes screenshots using `chrome.tabs.captureVisibleTab()`
- Sends captured data to background worker

### Phase 2: Sidebar Recording UI

**2.1 Refactor Recording Components**
- Extract core recording logic from `RecordingNew.tsx` into shared hooks
- Create `SidebarApp.tsx` as a lightweight version of the recording interface
- Components to include:
  - Recording controls (Start/Stop)
  - Live step list with thumbnails
  - Step editing (instruction text, warnings)
  - Save/Convert to SOP buttons

**2.2 Sidebar-Specific Styling**
- Narrow width optimized layout (300-400px)
- Compact step cards with collapsible details
- Fixed header with recording status
- Scrollable step list

**2.3 Authentication in Sidebar**
- Check auth state on sidebar open
- Show login prompt if not authenticated
- Token passed via `chrome.storage` to content scripts for API calls

### Phase 3: Real-Time Capture Integration

**3.1 Click Tracking Enhancement**
Current implementation in `useScreenCapture.ts` captures clicks within the web app. For the extension:
- Content script adds global click listener to target page
- Extract element metadata (text, tag, selectors, coordinates)
- Generate CSS selector for replay capability
- Send click data to sidebar via background worker

**3.2 Screenshot Capture**
- Use `chrome.tabs.captureVisibleTab()` in background worker (more reliable than html2canvas)
- Overlay click indicator on captured image
- Compress and send to sidebar for preview
- Upload to Supabase storage on save

**3.3 Instruction Generation**
- Reuse existing `getElementDescription()` logic from `useScreenCapture.ts`
- Run in content script context for access to target DOM
- Pass generated text to sidebar for display/editing

### Phase 4: Data Synchronization

**4.1 Supabase Integration**
- Reuse existing `recordingService.ts` functions
- Bundle Supabase client in sidebar build
- Auth token stored in `chrome.storage.sync` for cross-device support

**4.2 Offline Support**
- Queue steps locally if offline
- Sync when connection restored
- Show sync status indicator in sidebar

## Build Configuration

### Vite Configuration for Extension

Create a separate Vite config for building the extension:

```text
vite.config.extension.ts
- Multiple entry points (sidebar, content script, background)
- Output to extension/dist/
- Inline all assets (no dynamic imports in content scripts)
- Generate manifest.json with version from package.json
```

### NPM Scripts

```text
- "build:extension" - Build production extension
- "dev:extension" - Watch mode for extension development
- "package:extension" - Create .zip for Chrome Web Store submission
```

## UI/UX Considerations

### Sidebar Layout

```text
+------------------------+
|  Opstrace  [Recording] |  <- Header with status
+------------------------+
|  ● Recording: 02:45    |  <- Timer & controls
|  [Stop] [Pause]        |
+------------------------+
|  Step 1: Click "Login" |  <- Captured steps
|  [thumbnail] [edit]    |
|  ----------------      |
|  Step 2: Type email    |
|  [thumbnail] [edit]    |
|  ----------------      |
|  Step 3: Click Submit  |
|  [thumbnail] [edit]    |
+------------------------+
|  [Save] [Convert SOP]  |  <- Actions
+------------------------+
```

### Recording Flow

1. User clicks extension icon
2. Sidebar opens on right side of browser
3. User clicks "Start Recording"
4. As user interacts with any webpage:
   - Content script detects action
   - Screenshot captured
   - Step appears in sidebar with thumbnail
5. User can edit instructions inline
6. Click "Stop" then "Save" or "Convert to SOP"
7. Data synced to Supabase

## Database Considerations

The existing schema already supports this:
- `recordings` table: stores session metadata
- `steps` table: stores individual actions with screenshots
- `screenshots` storage bucket: stores captured images

No schema changes required.

## Security Considerations

- Content script runs in isolated world (no access to page JS)
- Supabase API key stored securely in `chrome.storage.sync`
- User authentication required before recording
- Screenshots only captured when recording is active
- Option to blur/redact sensitive areas before saving

## Technical Notes

### Why Manifest V3?

- Required for new Chrome Web Store submissions
- Uses service workers instead of persistent background pages
- Better security and performance
- Side Panel API only available in MV3

### Screenshot API Comparison

| Method | Pros | Cons |
|--------|------|------|
| html2canvas | Works anywhere | Slow, doesn't capture images |
| chrome.tabs.captureVisibleTab | Fast, accurate | Requires extension context |

The extension will use Chrome's native API for better quality and performance.

### Cross-Browser Support (Future)

The architecture can be adapted for:
- Firefox (WebExtensions API, similar but no sidePanel)
- Edge (Chromium-based, same as Chrome)
- Safari (would need significant changes)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `extension/manifest.json` | Create | Extension configuration |
| `extension/background.ts` | Create | Service worker |
| `extension/content/content-script.ts` | Create | Page injection script |
| `extension/content/click-tracker.ts` | Create | DOM event capture |
| `extension/sidebar/index.html` | Create | Sidebar HTML entry |
| `extension/sidebar/main.tsx` | Create | Sidebar React entry |
| `extension/sidebar/SidebarApp.tsx` | Create | Recording UI for sidebar |
| `extension/shared/types.ts` | Create | Shared types |
| `extension/shared/messaging.ts` | Create | Chrome messaging utilities |
| `vite.config.extension.ts` | Create | Extension build config |
| `package.json` | Modify | Add extension build scripts |
| `src/hooks/useScreenCapture.ts` | Modify | Extract reusable logic |
| `src/services/recordingService.ts` | Modify | Add offline queue support |

## Testing Strategy

1. **Local Development**: Load unpacked extension in Chrome
2. **Content Script Testing**: Verify capture on various websites
3. **Messaging Testing**: Ensure reliable communication between components
4. **Auth Testing**: Verify login flow works in sidebar context
5. **Sync Testing**: Confirm data persists to Supabase

## Estimated Effort

| Phase | Description | Complexity |
|-------|-------------|------------|
| Phase 1 | Extension Foundation | Medium |
| Phase 2 | Sidebar Recording UI | Medium |
| Phase 3 | Real-Time Capture | High |
| Phase 4 | Data Synchronization | Low |

## Summary

This plan transforms Opstrace into a Chrome extension while preserving all existing web app functionality. The sidebar provides a familiar recording interface that works on any website, capturing real user interactions with screenshots and generating clear SOP instructions automatically.
