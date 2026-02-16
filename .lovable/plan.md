

## Decision Tree Branching for Process Maps

This plan adds split decision points to the SOP/recording step editors and updates the process map visualization to render branching paths.

### What You'll Get

- When creating or editing a process, any step can be toggled into a **decision point**
- Decision points can be **simple** (just a description) or **split** (with YES/NO branches containing substeps)
- In split mode, two side-by-side columns appear: a green YES path and a red NO path
- Each branch supports independent substeps with descriptions, reordering, and deletion
- The process map diagram renders these branches as proper flowchart forks that rejoin the main flow

### Changes

#### 1. Database: Add Decision Branch Data to Steps

Add new columns to the `steps` and `sop_steps` tables to store branch data:

- `is_decision` (boolean, default false) -- marks a step as a decision point
- `decision_mode` (text, default 'simple') -- 'simple' or 'split'
- `yes_branch_steps` (jsonb, default '[]') -- array of substep objects for the YES path
- `no_branch_steps` (jsonb, default '[]') -- array of substep objects for the NO path

Using JSONB arrays keeps the schema simple -- substeps don't need their own table since they're always loaded/saved with their parent decision step.

Each substep object shape:
```text
{
  id: string,
  order_number: number,
  description: string
}
```

#### 2. New Component: `DecisionBranchEditor`

**File: `src/components/recording/DecisionBranchEditor.tsx`**

A new component that renders when a step is in "split" decision mode:

- Two side-by-side columns with card styling
- YES column: green border/accent, checkmark icon header, "+ Add Step" button
- NO column: red border/accent, X icon header, "+ Add Step" button
- Each substep row has: order number, description textarea, up/down reorder arrows, delete button
- Substeps numbered independently per branch (YES-1, YES-2... / NO-1, NO-2...)
- Branches can have different lengths

#### 3. Update Step Editors (SOPNew, SOPEdit, RecordingNew)

Add to each step card:

- A "Decision" toggle button (diamond icon) next to the existing warning toggle
- When toggled on, show a mode switcher: "Simple" vs "Split"
- In simple mode: just the existing description field (decision is noted but no branches)
- In split mode: render the `DecisionBranchEditor` component below the description
- The step's `actionType` changes to "decision" when toggled

Update the `SOPStep` and `RecordingStepData` interfaces to include `isDecision`, `decisionMode`, `yesBranchSteps`, and `noBranchSteps`.

#### 4. Update `StepTypeButtons`

Add a new "Decision" action type button alongside click, type, navigate, scroll, custom -- with a diamond icon and yellow accent color.

#### 5. Update Process Map Generation

**File: `src/components/process-map/ProcessMap.tsx`** -- update `generateNodesAndEdges`:

When a step has `is_decision: true` and `decision_mode: 'split'`:

- Render the decision step as a diamond-shaped node
- Create YES branch nodes offset to the left (x - 200)
- Create NO branch nodes offset to the right (x + 200)
- Connect decision node to first YES substep (green edge, "Yes" label)
- Connect decision node to first NO substep (red edge, "No" label)
- Chain substeps within each branch vertically
- Both branches converge to a "merge" node, which then connects to the next main step
- Track the Y offset so subsequent main steps are positioned below the longest branch

**File: `src/components/process-map/ProcessNode.tsx`** -- add decision node styling:

- New `decision` entry in `actionIcons` (diamond icon) and `actionColors` (yellow accent)
- Decision nodes get a rotated diamond shape via CSS transform

**File: `supabase/functions/generate-process-map/index.ts`** -- update the edge function:

- Accept `yes_branch_steps` and `no_branch_steps` in the Step interface
- When a step has `decision_mode: 'split'`, generate branching nodes/edges with proper positioning
- YES branch nodes positioned at x - 200, NO branch at x + 200
- Both branches connect back to a merge point before continuing to the next step

#### 6. Update Services

**File: `src/services/recordingService.ts`** and **`src/services/sopService.ts`**:

- Include `is_decision`, `decision_mode`, `yes_branch_steps`, `no_branch_steps` in create/update step calls

### Implementation Order

1. Database migration: add 4 new columns to `steps` and `sop_steps`
2. Create `DecisionBranchEditor` component
3. Add "decision" to `StepTypeButtons` action types
4. Update `SOPNew` and `SOPEdit` step cards with decision toggle and branch editor
5. Update `RecordingNew` step cards similarly
6. Update `ProcessNode` with decision node styling
7. Update `ProcessMap.generateNodesAndEdges` for branching layout
8. Update `generate-process-map` edge function for branching
9. Update recording/SOP services to persist branch data

### Technical Considerations

- JSONB storage for substeps avoids complex relational modeling while keeping data co-located with the parent step
- The merge node pattern ensures the flowchart always has a clear path forward after a decision
- Branch positioning uses fixed x-offsets (left/right of center) with dynamic y based on substep count
- The longer branch determines the Y position of the merge/next node

