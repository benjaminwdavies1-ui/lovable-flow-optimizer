# Chrome Extension - Opstrace SOP Creator

This folder contains the Chrome extension for capturing browser workflows.

## Structure

```
extension/
├── manifest.json          # Chrome Extension Manifest V3
├── background.ts          # Service worker for message routing
├── content/
│   ├── content-script.ts  # Injected into target pages
│   └── click-tracker.ts   # DOM event capture logic
├── sidebar/
│   ├── index.html         # Sidebar HTML entry
│   ├── main.tsx           # React app entry
│   ├── sidebar.css        # Sidebar styles
│   └── SidebarApp.tsx     # Main sidebar component
└── shared/
    ├── types.ts           # Shared TypeScript types
    └── messaging.ts       # Chrome messaging utilities
```

## Building the Extension

1. Build the extension:
   ```bash
   npm run build:extension
   ```

2. The built extension will be in `extension/dist/`

3. Add icon files to `extension/dist/icons/`:
   - icon16.png (16x16)
   - icon32.png (32x32)
   - icon48.png (48x48)
   - icon128.png (128x128)

## Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## Usage

1. Click the extension icon in Chrome toolbar
2. The sidebar opens on the right
3. Click "Start Recording"
4. Navigate and interact with any website
5. Each click/action is captured with a screenshot
6. Click "Stop" when done
7. Edit step instructions as needed
8. Save or convert to SOP

## Development

For development with hot reload:
```bash
npm run dev:extension
```

Then reload the extension in Chrome after each change.

## Architecture

- **Content Script**: Runs in every webpage, captures DOM events
- **Background Service Worker**: Central hub for messages and screenshot capture
- **Sidebar Panel**: React app for recording controls and step management
