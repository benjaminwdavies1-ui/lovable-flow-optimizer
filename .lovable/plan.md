

## Add SOP Browser to Extension Sidebar

Add a tab-based navigation to the extension sidebar so users can toggle between the recording tool and a list of their existing SOPs with expandable steps.

### UI Changes

The sidebar header will get two tab buttons: **Record** and **My SOPs**. The current recording UI stays under the "Record" tab. The "My SOPs" tab will show:

- A list of the user's SOPs fetched from the database
- Each SOP card shows title, status badge, step count, and last updated date
- Clicking an SOP expands it to show all its steps in order
- Each step shows its number, title/description, and screenshot (if available)
- A loading skeleton while fetching
- An empty state if no SOPs exist yet

### Technical Details

**File: `extension/shared/supabase.ts`**
- Add a `fetchUserSOPs()` function that queries the `sops` table for the authenticated user
- Add a `fetchSOPSteps(sopId)` function that queries `sop_steps` for a given SOP, ordered by `order_number`

**File: `extension/sidebar/SidebarApp.tsx`**
- Add a `activeTab` state: `"record" | "sops"`
- Render tab buttons in the header area below the title
- When `activeTab === "sops"`:
  - Fetch SOPs on mount/tab switch using the new supabase functions
  - Render a scrollable list of SOP cards
  - Each card is expandable to show steps with screenshots
- The recording tab remains unchanged

**File: `extension/sidebar/sidebar.css`**
- Add styles for the tab bar, SOP cards, step list within SOPs, status badges, and loading/empty states
- Keep consistent with existing dark theme variables

### Data Flow

1. User clicks "My SOPs" tab
2. Sidebar calls `fetchUserSOPs()` using the authenticated session
3. SOPs render as expandable cards
4. Clicking a card calls `fetchSOPSteps(sopId)` and shows the steps inline
5. Steps display their title, order number, and screenshot thumbnail

