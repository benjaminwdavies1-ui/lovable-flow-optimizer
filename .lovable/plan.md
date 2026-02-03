

# Phase 2: Authentication & Database Foundation

This phase establishes the secure backend infrastructure required before building the recording and SOP editing features.

---

## Overview

We need to set up two critical pieces:
1. **User Authentication** - Email/password login and signup so users can securely access their data
2. **Database Schema** - Tables for Profiles, Recordings, Steps, SOPs, and SOP_Steps with proper security policies

This ensures all subsequent features (recording sessions, SOP editing, etc.) can properly store and retrieve user-specific data.

---

## What Will Be Built

### 1. Authentication System
- New `/auth` page with login and signup forms
- Protected routes - redirect unauthenticated users to login
- Logout functionality in the sidebar
- Session management with automatic refresh

### 2. Database Tables

**profiles** - User profile information
- `id` (UUID, links to auth.users)
- `email`, `full_name`, `avatar_url`
- `created_at`, `updated_at`

**recordings** - Captured workflow sessions
- `id`, `user_id`, `title`
- `status` (in_progress, completed, converted)
- `started_at`, `ended_at`, `duration_seconds`
- `step_count`, `created_at`

**steps** - Individual actions within a recording
- `id`, `recording_id`, `order_number`
- `action_type` (click, navigation, form_submit, input, custom)
- `instruction_text`, `screenshot_url`
- `url`, `element_selector`, `timestamp`
- `is_redacted`, `has_warning`, `warning_text`

**sops** - Standard Operating Procedures
- `id`, `user_id`, `recording_id` (optional source)
- `title`, `description`, `version`
- `status` (draft, published)
- `created_at`, `updated_at`, `published_at`

**sop_steps** - Denormalized steps for SOP editing
- `id`, `sop_id`, `order_number`
- `title`, `description`, `screenshot_url`
- `has_warning`, `warning_text`, `is_redacted`
- `show_screenshot`

### 3. Security Policies
Each table will have Row-Level Security (RLS) policies ensuring:
- Users can only see their own recordings, steps, and SOPs
- Users can only modify their own data
- Profile creation happens automatically on signup

---

## Implementation Steps

### Step 1: Create Database Schema
Single migration with all tables, relationships, and RLS policies.

### Step 2: Create Authentication Context
A React context provider that manages:
- Current user/session state
- Login, signup, logout functions
- Loading states
- Automatic session refresh

### Step 3: Build Auth Page
A clean, professional login/signup page at `/auth` with:
- Toggle between login and signup modes
- Email and password validation
- Error handling with friendly messages
- Redirect to dashboard on success

### Step 4: Protect Application Routes
Wrap the app with an auth guard that:
- Shows loading state while checking auth
- Redirects to `/auth` if not logged in
- Allows access to protected pages if authenticated

### Step 5: Update Sidebar
Add user profile display and logout button to the sidebar.

---

## Technical Details

### Database Migration SQL

```text
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recordings table
create table public.recordings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled Recording',
  status text not null default 'in_progress' 
    check (status in ('in_progress', 'completed', 'converted')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer default 0,
  step_count integer default 0,
  created_at timestamptz default now()
);

-- Steps table
create table public.steps (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references public.recordings(id) on delete cascade not null,
  order_number integer not null,
  action_type text not null default 'custom'
    check (action_type in ('click', 'navigation', 'form_submit', 'input', 'custom')),
  instruction_text text,
  screenshot_url text,
  url text,
  element_selector text,
  timestamp timestamptz default now(),
  is_redacted boolean default false,
  has_warning boolean default false,
  warning_text text,
  created_at timestamptz default now()
);

-- SOPs table
create table public.sops (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  recording_id uuid references public.recordings(id) on delete set null,
  title text not null default 'Untitled SOP',
  description text,
  version integer default 1,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- SOP Steps table (denormalized for editing)
create table public.sop_steps (
  id uuid primary key default uuid_generate_v4(),
  sop_id uuid references public.sops(id) on delete cascade not null,
  order_number integer not null,
  title text,
  description text,
  screenshot_url text,
  has_warning boolean default false,
  warning_text text,
  is_redacted boolean default false,
  show_screenshot boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.steps enable row level security;
alter table public.sops enable row level security;
alter table public.sop_steps enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Recordings policies
create policy "Users can view own recordings"
  on public.recordings for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create recordings"
  on public.recordings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own recordings"
  on public.recordings for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own recordings"
  on public.recordings for delete
  to authenticated
  using (user_id = auth.uid());

-- Steps policies (based on recording ownership)
create policy "Users can view steps of own recordings"
  on public.steps for select
  to authenticated
  using (
    recording_id in (
      select id from public.recordings where user_id = auth.uid()
    )
  );

create policy "Users can create steps in own recordings"
  on public.steps for insert
  to authenticated
  with check (
    recording_id in (
      select id from public.recordings where user_id = auth.uid()
    )
  );

create policy "Users can update steps in own recordings"
  on public.steps for update
  to authenticated
  using (
    recording_id in (
      select id from public.recordings where user_id = auth.uid()
    )
  );

create policy "Users can delete steps in own recordings"
  on public.steps for delete
  to authenticated
  using (
    recording_id in (
      select id from public.recordings where user_id = auth.uid()
    )
  );

-- SOPs policies
create policy "Users can view own SOPs"
  on public.sops for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create SOPs"
  on public.sops for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own SOPs"
  on public.sops for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own SOPs"
  on public.sops for delete
  to authenticated
  using (user_id = auth.uid());

-- SOP Steps policies (based on SOP ownership)
create policy "Users can view steps of own SOPs"
  on public.sop_steps for select
  to authenticated
  using (
    sop_id in (
      select id from public.sops where user_id = auth.uid()
    )
  );

create policy "Users can create steps in own SOPs"
  on public.sop_steps for insert
  to authenticated
  with check (
    sop_id in (
      select id from public.sops where user_id = auth.uid()
    )
  );

create policy "Users can update steps in own SOPs"
  on public.sop_steps for update
  to authenticated
  using (
    sop_id in (
      select id from public.sops where user_id = auth.uid()
    )
  );

create policy "Users can delete steps in own SOPs"
  on public.sop_steps for delete
  to authenticated
  using (
    sop_id in (
      select id from public.sops where user_id = auth.uid()
    )
  );

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### New Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Auth state management and functions |
| `src/pages/Auth.tsx` | Login/signup page |
| `src/components/auth/AuthGuard.tsx` | Route protection wrapper |
| `src/components/auth/LoginForm.tsx` | Login form component |
| `src/components/auth/SignupForm.tsx` | Signup form component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with AuthProvider, add AuthGuard |
| `src/components/layout/AppSidebar.tsx` | Add user info and logout button |

---

## User Experience

1. **New users** visit the app and are redirected to `/auth`
2. They see a clean signup form, enter email/password, and create an account
3. After signup, they're automatically logged in and redirected to the dashboard
4. **Returning users** can log in with their credentials
5. The sidebar shows their email/name and provides a logout option
6. All their recordings and SOPs are private and secure

---

## After This Phase

With authentication and database in place, we can proceed to:
- **Phase 3: Recording Session** - Create `/recordings/new` with live step capture
- **Phase 4: SOP Editor** - Build the full editing interface
- **Phase 5: SOP Viewer & Export** - Read-only view and PDF export

