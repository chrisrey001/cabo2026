-- Supabase schema for Cabo '26 planner
-- Run in the Supabase SQL editor, then add these env vars locally:
--   VITE_SUPABASE_URL=<your-project-url>
--   VITE_SUPABASE_ANON_KEY=<your-anon-key>
--
-- Fully idempotent: safe to re-run at any time.
-- create policy has no "if not exists", so each policy is dropped then recreated.

-- ─── Phase 1: core tables ─────────────────────────────────────────────────────

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '✨',
  name text not null default '',
  role text not null default '',
  confirmed boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  couple text not null default '',
  sort integer not null default 0,
  outbound jsonb not null default '{}'::jsonb,
  return_leg jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '🌞',
  title text not null default '',
  day_label text not null default '',
  sort integer not null default 0,
  events jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Open RLS policies for the anon key (trip is private to the party via obscurity).
-- If you want auth-gated writes, replace these with something stricter.
alter table guests enable row level security;
alter table flights enable row level security;
alter table days enable row level security;

drop policy if exists "guests read" on guests;
drop policy if exists "guests write" on guests;
drop policy if exists "guests update" on guests;
drop policy if exists "guests delete" on guests;
create policy "guests read"   on guests for select using (true);
create policy "guests write"  on guests for insert with check (true);
create policy "guests update" on guests for update using (true);
create policy "guests delete" on guests for delete using (true);

drop policy if exists "flights read" on flights;
drop policy if exists "flights write" on flights;
drop policy if exists "flights update" on flights;
drop policy if exists "flights delete" on flights;
create policy "flights read"   on flights for select using (true);
create policy "flights write"  on flights for insert with check (true);
create policy "flights update" on flights for update using (true);
create policy "flights delete" on flights for delete using (true);

drop policy if exists "days read" on days;
drop policy if exists "days write" on days;
drop policy if exists "days update" on days;
drop policy if exists "days delete" on days;
create policy "days read"   on days for select using (true);
create policy "days write"  on days for insert with check (true);
create policy "days update" on days for update using (true);
create policy "days delete" on days for delete using (true);

-- ─── Phase 2: voting tables ───────────────────────────────────────────────────

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,  -- [{id, label}]
  created_at timestamptz not null default now(),
  closed boolean not null default false
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id text not null,
  voter_id text not null,
  voter_name text,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  cost text not null default '',
  cuisine text not null default '',
  distance text not null default '',
  hours text not null default '',
  phone text not null default '',
  vibe text not null default '',
  book text not null default '',
  cost_num integer not null default 0,
  added_by text,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_votes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  voter_id text not null,
  voter_name text,
  created_at timestamptz not null default now(),
  unique (restaurant_id, voter_id)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  icon text not null default '✨',
  cost text not null default '',
  duration text not null default '',
  distance text not null default '',
  description text not null default '',
  tag text not null default '',
  added_by text,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists activity_votes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  voter_id text not null,
  voter_name text,
  created_at timestamptz not null default now(),
  unique (activity_id, voter_id)
);

alter table polls enable row level security;
alter table votes enable row level security;
alter table restaurants enable row level security;
alter table restaurant_votes enable row level security;
alter table activities enable row level security;
alter table activity_votes enable row level security;

drop policy if exists "polls read" on polls;
drop policy if exists "polls write" on polls;
drop policy if exists "polls update" on polls;
drop policy if exists "polls delete" on polls;
create policy "polls read"   on polls for select using (true);
create policy "polls write"  on polls for insert with check (true);
create policy "polls update" on polls for update using (true);
create policy "polls delete" on polls for delete using (true);

drop policy if exists "votes read" on votes;
drop policy if exists "votes write" on votes;
drop policy if exists "votes update" on votes;
drop policy if exists "votes delete" on votes;
create policy "votes read"   on votes for select using (true);
create policy "votes write"  on votes for insert with check (true);
create policy "votes update" on votes for update using (true);
create policy "votes delete" on votes for delete using (true);

drop policy if exists "restaurants read" on restaurants;
drop policy if exists "restaurants write" on restaurants;
drop policy if exists "restaurants update" on restaurants;
drop policy if exists "restaurants delete" on restaurants;
create policy "restaurants read"   on restaurants for select using (true);
create policy "restaurants write"  on restaurants for insert with check (true);
create policy "restaurants update" on restaurants for update using (true);
create policy "restaurants delete" on restaurants for delete using (true);

drop policy if exists "restaurant_votes read" on restaurant_votes;
drop policy if exists "restaurant_votes write" on restaurant_votes;
drop policy if exists "restaurant_votes delete" on restaurant_votes;
create policy "restaurant_votes read"   on restaurant_votes for select using (true);
create policy "restaurant_votes write"  on restaurant_votes for insert with check (true);
create policy "restaurant_votes delete" on restaurant_votes for delete using (true);

drop policy if exists "activities read" on activities;
drop policy if exists "activities write" on activities;
drop policy if exists "activities update" on activities;
drop policy if exists "activities delete" on activities;
create policy "activities read"   on activities for select using (true);
create policy "activities write"  on activities for insert with check (true);
create policy "activities update" on activities for update using (true);
create policy "activities delete" on activities for delete using (true);

drop policy if exists "activity_votes read" on activity_votes;
drop policy if exists "activity_votes write" on activity_votes;
drop policy if exists "activity_votes delete" on activity_votes;
create policy "activity_votes read"   on activity_votes for select using (true);
create policy "activity_votes write"  on activity_votes for insert with check (true);
create policy "activity_votes delete" on activity_votes for delete using (true);
