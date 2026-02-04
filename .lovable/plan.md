
# Launch Readiness: Connect All Pages to Real Data + Convert to SOP

This plan covers connecting all pages to real database data and implementing the "Convert to SOP" feature to make the platform production-ready.

## Overview

Currently, the Dashboard, Recordings list, and SOPs list pages display hardcoded mock data. The "Convert to SOP" button exists but isn't fully implemented. This plan will:

1. Replace all mock data with real database queries
2. Implement the Convert to SOP feature
3. Add delete functionality for recordings and SOPs
4. Add proper loading and empty states

## Phase 1: SOP Service Layer

Create a new service file to handle all SOP-related database operations, similar to the existing `recordingService.ts`.

**New file: `src/services/sopService.ts`**

Functions to implement:
- `getUserSOPs()` - Fetch all SOPs for the current user
- `getSOPWithSteps(sopId)` - Fetch a single SOP with its steps
- `createSOPFromRecording(recordingId, userId)` - Convert a recording into an SOP
- `createSOP(title, description, userId)` - Create a new blank SOP
- `updateSOP(sopId, updates)` - Update SOP details
- `deleteSOP(sopId)` - Delete an SOP and its steps
- `createSOPStep(step)` - Add a step to an SOP
- `updateSOPStep(stepId, updates)` - Update a step
- `deleteSOPStep(stepId)` - Delete a step
- `getSOPStepCount(sopId)` - Get step count for an SOP

## Phase 2: Recordings Page - Real Data

Update `src/pages/Recordings.tsx` to:
- Fetch recordings from database using `getUserRecordings()`
- Add loading state with skeleton/spinner
- Add empty state when no recordings exist
- Implement delete recording functionality
- Add "Resume" navigation for in-progress recordings
- Wire up "Convert to SOP" button

**Key changes:**
- Replace `mockRecordings` with `useState` + `useEffect` data fetching
- Add `useAuth()` hook for user context
- Format duration from `duration_seconds` to "MM:SS" string
- Map database `status` field to UI status config

## Phase 3: SOPs Page - Real Data

Update `src/pages/SOPs.tsx` to:
- Fetch SOPs from database using `getUserSOPs()`
- Add loading state with skeleton/spinner
- Add empty state when no SOPs exist
- Implement delete SOP functionality
- Count steps from `sop_steps` table (or store in `sops` table)

**Key changes:**
- Replace `mockSOPs` with real data fetch
- Add step count via joined query or separate count
- Handle draft vs published status

## Phase 4: Dashboard - Real Statistics

Update `src/pages/Dashboard.tsx` to:
- Fetch real counts and statistics from database
- Calculate total recordings count
- Calculate total SOPs count
- Calculate total time documented (sum of `duration_seconds`)
- Calculate average steps per SOP
- Fetch recent 3 recordings and 2 SOPs

**Statistics to calculate:**
- Total Recordings: `SELECT COUNT(*) FROM recordings WHERE user_id = ?`
- SOPs Created: `SELECT COUNT(*) FROM sops WHERE user_id = ?`
- Time Documented: `SELECT SUM(duration_seconds) FROM recordings WHERE user_id = ?`
- Avg Steps per SOP: Calculate from steps count and SOP count

## Phase 5: Convert to SOP Feature

Implement the complete conversion flow in `src/pages/RecordingNew.tsx`:

1. When "Convert to SOP" is clicked:
   - Save the recording (already implemented)
   - Create a new SOP record linked to the recording
   - Copy all steps from `steps` table to `sop_steps` table
   - Mark recording status as "converted"
   - Navigate to the new SOP edit page

2. Add Convert to SOP action in Recordings list page:
   - When clicking "Convert to SOP" from dropdown
   - Perform same conversion logic
   - Navigate to SOP view/edit

**Database flow:**
```text
steps (recording_id: X) --> sop_steps (sop_id: Y)
recordings.status --> "converted"
sops.recording_id --> X
```

## Phase 6: SOP View Page - Real Data

Update `src/pages/SOPView.tsx` to:
- Fetch SOP by ID using `getSOPWithSteps(id)`
- Display real step data
- Show proper author info from profiles table (if linked)
- Handle loading and not-found states

## Phase 7: Add Recording Delete Service

Add to `src/services/recordingService.ts`:
- `deleteRecording(recordingId)` - Delete recording and all its steps

---

## Technical Details

### Database Queries Summary

**Recordings with count:**
```sql
SELECT *, 
  (SELECT COUNT(*) FROM steps WHERE recording_id = recordings.id) as step_count
FROM recordings 
WHERE user_id = $1 
ORDER BY created_at DESC
```

**SOPs with step count:**
```sql
SELECT sops.*, 
  (SELECT COUNT(*) FROM sop_steps WHERE sop_id = sops.id) as step_count
FROM sops 
WHERE user_id = $1 
ORDER BY updated_at DESC
```

**Dashboard statistics:**
```sql
-- Total recordings
SELECT COUNT(*) FROM recordings WHERE user_id = $1

-- Total SOPs  
SELECT COUNT(*) FROM sops WHERE user_id = $1

-- Total duration
SELECT COALESCE(SUM(duration_seconds), 0) FROM recordings WHERE user_id = $1
```

### Files to Create
1. `src/services/sopService.ts` - SOP database operations

### Files to Modify
1. `src/pages/Recordings.tsx` - Real data + delete + convert
2. `src/pages/SOPs.tsx` - Real data + delete
3. `src/pages/Dashboard.tsx` - Real statistics
4. `src/pages/RecordingNew.tsx` - Complete Convert to SOP
5. `src/pages/SOPView.tsx` - Real data
6. `src/services/recordingService.ts` - Add delete function
7. `src/components/dashboard/RecentRecordings.tsx` - Update interface for real data
8. `src/components/dashboard/RecentSOPs.tsx` - Update interface for real data

### Loading & Error States
- Use `Skeleton` components during loading
- Show toast notifications for errors
- Empty state cards when no data exists

## Implementation Order

1. Create SOP service layer (foundation for everything else)
2. Update Recordings page (most visible change)
3. Implement Convert to SOP in RecordingNew
4. Update SOPs page
5. Update SOPView page
6. Update Dashboard with real stats
7. Test complete flow end-to-end
