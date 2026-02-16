

## Continuous Monitoring + Manual Recording: Dual-Mode Extension

Add an "always-on" background monitoring mode alongside the existing manual recording, so users can either passively capture their day or intentionally record specific processes.

### How It Works for You

- **Manual Recording** (existing): Click "Start Recording", do your workflow, click "Stop". You control exactly what gets captured.
- **Always-On Monitoring** (new): Flip a toggle and go about your day. The extension quietly logs your browser activity in the background. Later, AI groups those actions into detected processes you can review, name, and convert into SOPs.

You can use both at the same time -- the always-on monitor keeps running even while you do a manual recording.

### What You'll See

**In the Extension Sidebar:**
- A new "Monitor" tab alongside "Record" and "My SOPs"
- A simple on/off toggle switch
- Live event counter ("142 events today")
- A timeline of AI-detected process clusters for today
- Each cluster shows: AI-generated name, time range, event count, confidence score
- Actions: "Convert to Recording", "Dismiss", or expand to see raw events

**On the Web Page (while monitoring):**
- A small, subtle green dot in the top-right corner (instead of the red banner used during manual recording)

**In the Web App (Insights page):**
- A new "Daily Activity" section showing detected process clusters
- A "Run Segmentation" button to trigger AI analysis of today's events
- An activity timeline visualization

### Technical Details

#### 1. Database: Two New Tables

**`activity_events`** -- lightweight raw event log
- id, user_id, action_type, url, element_info (jsonb), screenshot_url (nullable), timestamp, session_date, cluster_id (nullable, filled by AI), created_at
- RLS: users can only read/write their own events

**`process_clusters`** -- AI-detected process groupings
- id, user_id, title, description, start_time, end_time, event_count, confidence_score, status (detected/confirmed/dismissed), converted_to_recording_id (nullable), created_at
- RLS: users can only access their own clusters

#### 2. Extension Changes

**`extension/shared/types.ts`**
- Add new message types: `TOGGLE_CONTINUOUS`, `CONTINUOUS_CAPTURE`, `CONTINUOUS_STATUS`
- Add `ActivityEvent` interface and continuous mode storage key

**`extension/background.ts`**
- Add `continuousMode` flag
- New `TOGGLE_CONTINUOUS` handler to enable/disable
- New `CONTINUOUS_CAPTURE` handler that batches events in memory and flushes to `activity_events` every 30 seconds or every 10 events
- Screenshots captured only every 5th event (lower quality) to save storage
- Insert a "gap" marker when no events for 5+ minutes
- Continuous mode runs independently of manual recording sessions

**`extension/content/content-script.ts`**
- Check `opstrace_continuous` in storage on init
- When continuous mode is on AND not in manual recording, send `CONTINUOUS_CAPTURE` instead of `CAPTURE_STEP`
- When both are on, send both message types
- Show subtle green dot indicator (not the red recording banner)

**`extension/shared/supabase.ts`**
- Add `batchInsertActivityEvents()` to bulk-insert events
- Add `fetchTodayClusters()` to get today's process clusters
- Add `fetchClusterEvents(clusterId)` to get events in a cluster
- Add `updateClusterStatus()` for confirm/dismiss actions

**`extension/sidebar/SidebarApp.tsx`**
- Add third tab: "Monitor" with a toggle switch, event counter, and cluster list
- Clusters are expandable cards with convert/dismiss actions

**`extension/sidebar/sidebar.css`**
- Styles for the monitor tab, green dot status, cluster cards, and timeline

#### 3. New Edge Function: `segment-processes`

- Accepts `{ user_id, date? }` (defaults to today)
- Fetches all `activity_events` for that user/date that have no cluster_id
- Uses time gaps (5+ min), URL domain changes, and AI analysis (Gemini 2.5 Flash) to segment events into clusters
- AI prompt: "Given this sequence of browser interactions, identify distinct business processes. Group related actions and name each process."
- Writes results to `process_clusters` and updates `activity_events.cluster_id`

#### 4. Updated Edge Function: `analyze-business-context`

- Also pull from `process_clusters` to enrich business understanding
- Detect recurring processes (same cluster pattern seen multiple times)

#### 5. Web App: Insights Page

- Add "Daily Activity" card with date picker and cluster list
- "Run Segmentation" button triggers the `segment-processes` edge function
- Each cluster card has: title, time range, event count, confidence badge, and "Convert to SOP" button

### Implementation Order

1. Create `activity_events` and `process_clusters` tables with RLS
2. Update extension types with new message types and interfaces
3. Add continuous mode to background worker (batching + flush logic)
4. Update content script with continuous capture and green dot indicator
5. Add supabase helper functions for activity events and clusters
6. Add "Monitor" tab to sidebar UI
7. Create `segment-processes` edge function
8. Update `analyze-business-context` to include cluster data
9. Add daily activity section to Insights page

### Performance and Privacy Considerations

- **Batching**: Events are held in memory and flushed periodically, not sent one-by-one
- **Screenshot throttling**: Only every 5th event gets a screenshot, at lower quality
- **Green dot indicator**: Users always know monitoring is active
- **No content capture**: Only element metadata (tag, text, selector) is logged -- no passwords or typed content
- **Session date partitioning**: Makes it easy to query by day and purge old data

