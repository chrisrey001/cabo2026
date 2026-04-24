-- Phase 3 migration — run this in Supabase SQL editor on an existing Phase 2 database

create table if not exists activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  author text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table activity_comments enable row level security;

drop policy if exists "activity_comments read"   on activity_comments;
drop policy if exists "activity_comments write"  on activity_comments;
drop policy if exists "activity_comments delete" on activity_comments;

create policy "activity_comments read"   on activity_comments for select using (true);
create policy "activity_comments write"  on activity_comments for insert with check (true);
create policy "activity_comments delete" on activity_comments for delete using (true);
