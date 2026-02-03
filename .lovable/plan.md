
# Phase 3+: Process Maps & Business Intelligence AI

This builds on the core platform by adding two powerful AI-driven features:
1. **Visual Process Maps** - Automatically generated flowcharts from recorded steps
2. **Business Context AI** - An intelligent assistant that learns your organization's processes and provides optimization recommendations

---

## Overview

### Process Map Generation
When a user records a workflow or views an SOP, the system will generate an interactive flowchart showing:
- Sequential steps as nodes
- Decision points and branches
- Navigation flows between URLs/screens
- Warnings and critical steps highlighted

### Business Intelligence AI
The AI assistant will evolve from a generic helper to a context-aware business analyst that:
- Learns from all recorded workflows and SOPs
- Identifies patterns, redundancies, and bottlenecks
- Recommends process improvements and automation opportunities
- Understands your business operations holistically

---

## What Will Be Built

### 1. Process Map Visualization

**Interactive Flowchart Component**
- Rendered using a flowchart library (react-flow or Mermaid)
- Nodes represent steps with action icons
- Edges show flow direction
- Color-coded by action type (click, navigation, form submission)
- Zoom and pan controls
- Warning steps highlighted in amber/red

**Automatic Generation**
- Edge function that takes steps and produces a flowchart structure
- AI analyzes step descriptions to identify decision points
- Groups related steps into logical phases

**Display Locations**
- Recording detail view
- SOP viewer page
- Dedicated "Process Map" tab

### 2. Business Context Knowledge Base

**New Database Tables**

```text
business_context
├── id (uuid)
├── user_id (uuid)
├── context_type ('process_pattern', 'business_rule', 'optimization_insight')
├── title (text)
├── content (text) - AI-generated summary
├── source_ids (uuid[]) - Recording/SOP IDs this came from
├── confidence_score (float)
├── created_at, updated_at
```

```text
ai_recommendations
├── id (uuid)
├── user_id (uuid)
├── recommendation_type ('automation', 'consolidation', 'warning', 'efficiency')
├── title (text)
├── description (text)
├── affected_processes (uuid[]) - Related SOP IDs
├── status ('pending', 'applied', 'dismissed')
├── created_at
```

### 3. Enhanced AI Assistant

**Context-Aware Chat**
- Before responding, AI queries user's recordings, SOPs, and business context
- Understands what processes exist and how they relate
- Can answer questions like "How do we handle refunds?" or "What's our onboarding process?"

**Proactive Recommendations**
- "I noticed 3 SOPs share similar first steps - consider creating a reusable template"
- "Your order processing takes 18 steps - similar businesses average 12"
- "This step appears in 5 different processes - good candidate for automation"

**Business Analysis Commands**
- "Analyze my processes" - Generates insights dashboard
- "Find automation opportunities" - Scans for repetitive patterns
- "Compare process X to Y" - Side-by-side analysis

---

## Architecture

```text
User records workflow
        │
        ▼
┌───────────────────┐
│  Steps saved to   │
│     database      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐    ┌────────────────────────┐
│  generate-process-│───▶│  Process Map JSON      │
│  map edge function│    │  (nodes, edges, layout)│
└───────────────────┘    └────────────────────────┘
          │
          ▼
┌───────────────────┐    ┌────────────────────────┐
│  analyze-business │───▶│  Business Context      │
│  -context function│    │  Knowledge Base        │
└───────────────────┘    └────────────────────────┘
          │
          ▼
┌───────────────────┐
│  AI Chat with     │
│  RAG over context │
└───────────────────┘
```

---

## Implementation Steps

### Step 1: Add React Flow for Diagrams
Install react-flow library and create a ProcessMap component that renders step data as an interactive flowchart.

### Step 2: Create Process Map Generation Edge Function
New `generate-process-map` function that:
- Takes an array of steps
- Uses AI to identify step relationships and decision points
- Returns a structured node/edge graph

### Step 3: Add Business Context Tables
Database migration for `business_context` and `ai_recommendations` tables with RLS policies.

### Step 4: Create Business Analysis Edge Function
New `analyze-business-context` function that:
- Runs periodically or on-demand
- Scans all user's recordings and SOPs
- Identifies patterns, redundancies, improvement opportunities
- Stores insights in business_context table

### Step 5: Enhance Chat Function with RAG
Update the existing chat edge function to:
- Query user's SOPs, recordings, and business context before responding
- Include relevant process information in the AI prompt
- Generate contextual, business-specific responses

### Step 6: Build Insights Dashboard
New dashboard section showing:
- AI-generated process map overview
- Recommendations panel
- Business metrics and pattern insights

---

## New Files

| File | Purpose |
|------|---------|
| `src/components/process-map/ProcessMap.tsx` | Interactive flowchart component using react-flow |
| `src/components/process-map/ProcessNode.tsx` | Custom node component for steps |
| `src/components/insights/InsightsPanel.tsx` | AI recommendations display |
| `src/components/insights/RecommendationCard.tsx` | Individual recommendation component |
| `src/pages/Insights.tsx` | Business intelligence dashboard |
| `supabase/functions/generate-process-map/index.ts` | AI-powered map generation |
| `supabase/functions/analyze-business-context/index.ts` | Background business analysis |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/chat/index.ts` | Add RAG queries for business context |
| `src/components/ai/AIAssistant.tsx` | Add quick action buttons for analysis |
| `src/components/layout/AppSidebar.tsx` | Add Insights navigation link |
| `src/App.tsx` | Add route for /insights page |

---

## User Experience

1. **Recording Completion**: User finishes recording, sees a generated process map
2. **SOP View**: Each SOP shows its process map visually
3. **Insights Page**: Dashboard with AI-detected patterns and recommendations
4. **Chat Assistant**: Ask "What processes do I have?" and get accurate answers
5. **Recommendations**: "3 of your processes could be combined" notification

---

## Technical Details

### Process Map Data Structure

```typescript
interface ProcessMapData {
  nodes: {
    id: string;
    type: 'step' | 'decision' | 'start' | 'end';
    label: string;
    actionType: string;
    hasWarning: boolean;
    position: { x: number; y: number };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
  }[];
}
```

### RAG Context for Chat

The enhanced chat function will include in the system prompt:

```text
## User's Business Context

Recorded Processes:
- Customer Order Processing (12 steps)
- Refund Request Handling (8 steps)
- Employee Onboarding (18 steps)

Key Patterns Identified:
- Login is first step in 80% of processes
- Average process length: 12 steps
- Most common actions: Click (45%), Navigation (30%), Form Submit (15%)

Active Recommendations:
- Consider combining duplicate login steps
- Refund process could be automated after step 3
```

---

## Dependencies

- **react-flow** (or similar): For interactive process map visualization
- No additional AI API keys needed - uses existing Lovable AI

---

## Phased Rollout

**Phase 3A: Process Maps (Build First)**
- Install react-flow
- Create ProcessMap component
- Create generate-process-map edge function
- Add process map to SOP viewer

**Phase 3B: Business Intelligence (Build Second)**
- Add database tables for context and recommendations
- Create analyze-business-context function
- Enhance chat with RAG
- Build Insights dashboard

