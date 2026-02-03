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