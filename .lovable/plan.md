
## Populate the Platform with Realistic Demo Data

### Goal

Seed the database with realistic, professional SOPs, steps, recordings, knowledge base entries, and automation suggestions — all tied to the existing user account (`benjaminwdavies1@gmail.com`) — so the dashboard, SOP library, knowledge base, and insights panels all display rich, meaningful data.

### What Will Be Created

#### 5 SOPs (mix of Published + Draft)

| # | Title | Status | Dept | Employees | Tools | Steps |
|---|-------|--------|------|-----------|-------|-------|
| 1 | Onboarding a New Employee | Published | HR | HR Team | Slack, Google Workspace, BambooHR | 7 |
| 2 | Processing a Customer Refund | Published | Customer Success | Support Team | Stripe, Zendesk, Salesforce | 6 |
| 3 | Publishing a Blog Post | Published | Marketing | Content Team | WordPress, Grammarly, Canva | 5 |
| 4 | Deploying a Hotfix to Production | Draft | Engineering | Dev Team | GitHub, Jira, Datadog | 8 |
| 5 | Monthly Expense Report Submission | Draft | Finance | All Staff | Xero, Expensify | 5 |

Each SOP gets realistic step titles, detailed descriptions, and some steps will have warnings flagged (e.g. "Do not skip manager approval").

#### 2 Recordings (raw captures, unconverted)

- "Stripe Refund Walkthrough" — 6 steps, in_progress
- "GitHub PR Merge Process" — 5 steps, completed

#### 8 Knowledge Base Entries

- **Software**: How we use Salesforce, Slack communication guidelines, Our Stripe billing setup
- **Process**: Monthly reporting cycle, Incident response procedure
- **General**: Company values and how they apply to ops, Team timezone overview
- **Tips**: Zendesk ticket triage tips

#### 4 Automation Suggestions

- Auto-send welcome email when new employee is onboarded (via Slack + BambooHR)
- Auto-create Zendesk ticket from Stripe refund trigger
- Auto-post blog to social media after WordPress publish
- Weekly Expensify reminder via Slack

### Technical Approach

All data will be inserted using a single SQL migration executed via the database migration tool. Since the data must be scoped to the real user ID (`bbc28270-a944-4015-96c4-47cd33408edd`), and RLS is active, the inserts will use that user_id directly — which is valid in a migration run with service-role access.

The migration will:
1. Insert 2 recordings
2. Insert steps for each recording
3. Insert 5 SOPs with all tags
4. Insert all SOP steps with realistic descriptions (some with warnings)
5. Insert 8 knowledge_entries
6. Insert 4 automation_suggestions

### No Code Changes Required

This is purely a data seeding operation. No React components, hooks, or edge functions need to change — the existing UI is already built to display all of this data correctly.

### What You'll See After

- **Dashboard**: "SOPs Created: 5", "Avg. Steps per SOP: 6", recent SOPs listed with status badges
- **SOPs page**: Full table with all 5 SOPs, tags, version numbers, step counts, and status
- **SOP View**: Click any SOP to see a full step-by-step procedure with warnings, departments, employees, and tools
- **Knowledge Base**: 8 cards across all 4 categories with tags and searchable content
- **Insights Overview**: Stats cards showing 5 SOPs, 3 published, avg 6 steps, warnings flagged
- **Automation Recommendations**: 4 AI-generated suggestions with difficulty ratings and estimated time saved
