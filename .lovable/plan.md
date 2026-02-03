

# Opstrace - Operations Intelligence Platform MVP

## Product Vision
A web-based SaaS platform that helps operations teams automatically generate SOPs from real work, understand time spent across systems, and identify automation opportunities.

---

## Information Architecture

### Primary Navigation
- **Dashboard** - Overview of recent recordings, SOPs, and quick actions
- **Recordings** - List of all recording sessions with status
- **SOPs** - Library of generated Standard Operating Procedures
- **Settings** - User profile, team management, export preferences

### Future Navigation Stubs (UI only)
- **Insights** - Operations activity analytics (placeholder)
- **Automation** - Automation opportunities (placeholder)

---

## Core Pages & Layouts

### 1. Dashboard
- Welcome message with user context
- Quick "Start Recording" prominent CTA
- Recent recordings (last 5)
- Recent SOPs (last 5)
- Activity summary cards (total recordings, SOPs created, time documented)

### 2. Recordings List
- Table/card view of all recordings
- Status indicators (In Progress, Completed, Converted to SOP)
- Duration, date, step count
- Actions: View, Convert to SOP, Delete

### 3. Recording Session (Active State)
- Floating control bar with:
  - Recording timer
  - Step counter
  - Pause/Resume button
  - Stop & Save button
- Live step feed showing captured interactions
- Simulated capture (since browser extension is out of scope, we'll provide manual step entry + a demo mode)

### 4. SOP Editor
- Left sidebar: Step list with drag-to-reorder
- Main content: Selected step detail
  - Step number (auto-generated)
  - Title (editable)
  - Description (rich text)
  - Screenshot area (placeholder with upload option)
  - Timestamp display
  - Warning/Note toggle
  - Sensitive info redaction checkbox
- Right panel: SOP metadata (title, description, tags, version)
- Toolbar: Save, Preview, Export options

### 5. SOP Viewer
- Clean, professional documentation view
- Print-optimized layout
- Step-by-step with screenshots
- Export buttons (Web link, PDF download)

### 6. Settings
- Profile management
- Team invitations (future)
- Export preferences
- Browser extension download link (placeholder)

---

## Data Models

### User
- id, email, name, avatar, created_at

### Recording
- id, user_id, title, status (in_progress | completed | converted)
- started_at, ended_at, duration_seconds
- step_count, created_at

### Step
- id, recording_id, order_number
- action_type (click | navigation | form_submit | input | custom)
- instruction_text (auto-generated or edited)
- screenshot_url (nullable)
- url, element_selector, timestamp
- is_redacted, has_warning, warning_text
- created_at

### SOP
- id, user_id, recording_id (nullable - can be standalone)
- title, description, version
- status (draft | published)
- steps (embedded or linked)
- created_at, updated_at, published_at

### SOP_Step (denormalized for editing)
- id, sop_id, order_number
- title, description, screenshot_url
- has_warning, warning_text, is_redacted
- show_screenshot

---

## Core User Flows

### Flow 1: Create SOP from Recording
1. User clicks "Start Recording" from Dashboard
2. Recording session begins with floating control bar
3. User performs work (simulated via manual entry in MVP)
4. User clicks "Stop Recording"
5. Recording saved → User prompted to "Convert to SOP" or "Save for Later"
6. If converting: Redirected to SOP Editor with pre-populated steps
7. User edits, reorders, adds notes
8. User saves and optionally publishes
9. SOP available in library

### Flow 2: Manual SOP Creation
1. User navigates to SOPs → "Create New"
2. Opens blank SOP Editor
3. User manually adds steps with descriptions and screenshots
4. User saves and publishes

### Flow 3: Export SOP
1. User opens SOP from library
2. Clicks "Export"
3. Chooses format: Web Link (shareable URL) or PDF
4. Downloads or copies link

---

## Component Structure

### Layout Components
- `AppLayout` - Main app shell with sidebar navigation
- `DashboardLayout` - Dashboard-specific grid layout
- `EditorLayout` - Three-panel layout for SOP editing

### Feature Components
- `RecordingControls` - Start/Stop/Pause floating bar
- `StepCapture` - Individual step display during recording
- `StepEditor` - Editable step card with all fields
- `StepList` - Draggable list of steps
- `SOPViewer` - Read-only rendered SOP
- `ExportDialog` - Export format selection modal

### UI Components
- `StatusBadge` - Recording/SOP status indicators
- `TimeDisplay` - Duration formatting
- `ScreenshotPlaceholder` - Image upload/placeholder
- `RedactionOverlay` - Blur/hide sensitive areas

---

## Design System

### Visual Style
- Clean, professional, operations-focused
- Neutral color palette (slate/gray base)
- Accent color for primary actions (blue)
- Success/warning/error states
- Generous whitespace
- Clear typography hierarchy

### Tone
- Professional, not playful
- Action-oriented language
- Avoid creator/consumer terminology
- Use operations vocabulary (procedure, workflow, process, system)

---

## Backend Requirements (Supabase)

### Authentication
- Email/password signup and login
- Protected routes for all app pages

### Database
- Tables for Users, Recordings, Steps, SOPs, SOP_Steps
- Row-level security per user

### Storage
- Screenshot uploads to Supabase Storage
- PDF generation (future - initially just web view)

---

## Future-Ready Architecture

### Placeholder Pages
- **Insights** page with mock charts showing:
  - Time spent per application
  - Daily/weekly activity timeline
  - Repeated workflow detection

- **Automation** page with mock cards showing:
  - Detected repetitive tasks
  - Estimated time savings
  - Suggested tools
  - Complexity ratings

These will be UI-only with sample data, structured so real analytics can plug in later.

---

## Implementation Phases

### Phase 1: Foundation
- App layout and navigation
- Authentication (Supabase)
- Dashboard with placeholder data

### Phase 2: Recording System
- Recording list page
- Manual step entry flow (simulating capture)
- Recording controls and step display

### Phase 3: SOP Editor
- Full SOP editing interface
- Step reordering, editing, notes
- Screenshot upload support

### Phase 4: SOP Output
- Clean viewer page
- Shareable web links
- PDF export (or print-to-PDF)

### Phase 5: Polish & Stubs
- Future feature placeholders
- Settings page
- Onboarding flow

