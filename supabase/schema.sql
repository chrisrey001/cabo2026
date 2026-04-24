-- Supabase schema for Cabo '26 planner
-- Run in the Supabase SQL editor, then add these env vars locally:
--   VITE_SUPABASE_URL=<your-project-url>
--   VITE_SUPABASE_ANON_KEY=<your-anon-key>

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

create policy "guests read" on guests for select using (true);
create policy "guests write" on guests for insert with check (true);
create policy "guests update" on guests for update using (true);
create policy "guests delete" on guests for delete using (true);

create policy "flights read" on flights for select using (true);
create policy "flights write" on flights for insert with check (true);
create policy "flights update" on flights for update using (true);
create policy "flights delete" on flights for delete using (true);

create policy "days read" on days for select using (true);
create policy "days write" on days for insert with check (true);
create policy "days update" on days for update using (true);
create policy "days delete" on days for delete using (true);
