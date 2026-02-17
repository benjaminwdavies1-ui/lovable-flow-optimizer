

## Restructure Insights into Dashboard + 3 Sub-Pages

### Overview

The current Insights page is a single long page. This plan restructures it into a proper navigation layout with 4 views:

1. **Overview Dashboard** (`/insights`) -- Stats cards, daily activity clusters, quick summaries
2. **Process Maps** (`/insights/process-maps`) -- Browse all SOPs as interactive flowcharts
3. **Business Knowledge** (`/insights/knowledge`) -- AI-detected patterns, rules, and optimization insights
4. **Automation Recommendations** (`/insights/automations`) -- Merges the current standalone Automations page into Insights

The AI analysis is already connected via Lovable AI through the existing backend functions (`analyze-business-context`, `suggest-automations`, `segment-processes`). No new backend work is needed -- we just need to reorganize the frontend.

### Changes

#### 1. Update Sidebar Navigation

- Move "Insights" from "Coming Soon" to the main nav group
- Add sub-items under Insights: Overview, Process Maps, Knowledge, Automations
- Remove the standalone "Automations" entry
- Use collapsible sub-menu or flat links with indentation

#### 2. Create Sub-Page Components

**`src/pages/insights/InsightsOverview.tsx`**
- Stats grid (SOPs count, avg steps, today's events, warnings)
- Daily Activity section with process cluster detection (the "Run Segmentation" feature)
- A small preview of latest process map and recent recommendations
- "Analyze" button that triggers the `analyze-business-context` function

**`src/pages/insights/ProcessMaps.tsx`**
- List all user SOPs with a selector dropdown
- Render the selected SOP's steps as an interactive process map (using existing `ProcessMap` component)
- Show decision tree branches where applicable

**`src/pages/insights/BusinessKnowledge.tsx`**
- Full view of all business context entries (patterns, rules, insights)
- Filter by context type (pattern / rule / insight)
- "Run Analysis" button to trigger the `analyze-business-context` function
- Shows the AI recommendations panel (InsightsPanel) alongside

**`src/pages/insights/AutomationRecommendations.tsx`**
- Migrated content from the current `Automations.tsx` page
- SOP selector + automation suggestions panel
- Stats for total/implemented/pending suggestions

#### 3. Update Routing in `App.tsx`

- Add routes for `/insights`, `/insights/process-maps`, `/insights/knowledge`, `/insights/automations`
- Remove the `/automations` route (or redirect it to `/insights/automations`)

#### 4. Create Insights Layout with Tab Navigation

**`src/pages/insights/InsightsLayout.tsx`**
- Shared layout wrapper with a horizontal tab bar at the top
- Tabs: Overview | Process Maps | Business Knowledge | Automations
- Each tab links to its sub-route
- Active tab highlighted based on current path

#### 5. Clean Up

- Remove `src/pages/Automations.tsx` (content moved into the new sub-page)
- Update `src/pages/Insights.tsx` to become a simple redirect/wrapper to the new layout
- Remove "Automations" from sidebar `futureNavItems`

### Technical Details

- Tab navigation uses `react-router-dom`'s `useLocation` to determine active tab and `Link` components for navigation
- All existing queries, mutations, and edge function calls remain unchanged
- The `InsightsPanel`, `BusinessContextCard`, `RecommendationCard`, `AutomationSuggestionsPanel`, and `ProcessMap` components are reused as-is
- No database changes needed
- No new backend functions needed

### Implementation Order

1. Create `InsightsLayout.tsx` with tab navigation
2. Create the 4 sub-page components by extracting sections from existing `Insights.tsx` and `Automations.tsx`
3. Update `App.tsx` routing
4. Update `AppSidebar.tsx` navigation structure
5. Delete old `Automations.tsx`
