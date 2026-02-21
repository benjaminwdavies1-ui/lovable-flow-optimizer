
# Public Landing Page with Email Collection

## Overview
Create a public-facing landing page at the root URL (`/`) that showcases Opstrace and lets visitors submit their email to join a waitlist. All existing app routes remain behind authentication but are moved under a `/app` prefix.

## What You'll Get
- A clean, professional landing page describing Opstrace
- An email signup form where visitors can submit their email
- Emails stored securely in the database
- A success message after submission
- All existing app functionality untouched, just moved to `/app/*`

## How It Works

1. **New database table** -- `waitlist_emails` to store submitted emails (with duplicate prevention)
2. **New landing page** -- `src/pages/Landing.tsx` with:
   - Hero section with tagline ("Capture workflows. Generate SOPs.")
   - Brief feature highlights (Record, Generate, Automate)
   - Email input + "Join the Waitlist" button
   - Success/error feedback via toast
3. **Updated routing** in `App.tsx`:
   - `/` renders the public Landing page (no auth required)
   - `/auth` remains public
   - All authenticated routes move to `/app`, `/app/sops`, `/app/settings`, etc.
   - Dashboard becomes `/app` instead of `/`
4. **Sidebar and nav links** updated to use `/app/*` paths

## Technical Details

### Database Migration
```sql
CREATE TABLE public.waitlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous) to insert
CREATE POLICY "Anyone can submit email"
  ON public.waitlist_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Authenticated users can view waitlist"
  ON public.waitlist_emails FOR SELECT
  TO authenticated
  USING (true);
```

### Files to Create
- `src/pages/Landing.tsx` -- Landing page with hero, features, and email form

### Files to Modify
- `src/App.tsx` -- Add Landing route at `/`, prefix all auth-guarded routes with `/app`
- `src/components/layout/AppSidebar.tsx` -- Update nav links to `/app/*`
- `src/components/auth/AuthGuard.tsx` -- Redirect to `/auth` (unchanged behavior, just confirming)
- `src/contexts/AuthContext.tsx` -- Update redirect after login to `/app`
- `src/pages/Auth.tsx` -- Navigate to `/app` after login instead of `/`
- `src/components/ai/AIAssistant.tsx` -- Update any internal navigation references
- Any other components with hardcoded route references (NavLink, sidebar, etc.)

### Landing Page Design
- Uses existing Tailwind design tokens (primary blue, neutral backgrounds)
- Responsive layout, mobile-friendly
- Simple email input with zod validation
- Inserts directly into `waitlist_emails` via the client SDK (anon insert policy)
- Shows toast on success: "You're on the list!"
- Prevents duplicate submissions gracefully
