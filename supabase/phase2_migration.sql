-- Phase 2 migration — paste this into the Supabase SQL editor.
-- Only adds the new Phase 2 tables. Does NOT touch Phase 1 tables.

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
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

create policy "polls read"   on polls for select using (true);
create policy "polls write"  on polls for insert with check (true);
create policy "polls update" on polls for update using (true);
create policy "polls delete" on polls for delete using (true);

create policy "votes read"   on votes for select using (true);
create policy "votes write"  on votes for insert with check (true);
create policy "votes update" on votes for update using (true);
create policy "votes delete" on votes for delete using (true);

create policy "restaurants read"   on restaurants for select using (true);
create policy "restaurants write"  on restaurants for insert with check (true);
create policy "restaurants update" on restaurants for update using (true);
create policy "restaurants delete" on restaurants for delete using (true);

create policy "restaurant_votes read"   on restaurant_votes for select using (true);
create policy "restaurant_votes write"  on restaurant_votes for insert with check (true);
create policy "restaurant_votes delete" on restaurant_votes for delete using (true);

create policy "activities read"   on activities for select using (true);
create policy "activities write"  on activities for insert with check (true);
create policy "activities update" on activities for update using (true);
create policy "activities delete" on activities for delete using (true);

create policy "activity_votes read"   on activity_votes for select using (true);
create policy "activity_votes write"  on activity_votes for insert with check (true);
create policy "activity_votes delete" on activity_votes for delete using (true);
