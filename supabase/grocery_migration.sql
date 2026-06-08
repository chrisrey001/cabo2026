-- Grocery list: shared, editable shopping list for stocking the villa.
-- Idempotent: safe to re-run. Paste into the Supabase SQL editor.

create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  item text not null default '',
  qty text not null default '',            -- free-text quantity/note, e.g. "2 bottles"
  category text not null default 'Other',  -- Drinks | Produce | Snacks | Meat & Seafood | Pantry | Household | Other
  checked boolean not null default false,  -- bought / got it
  added_by text,                           -- reserved for future "who's bringing"
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table grocery_items enable row level security;

drop policy if exists "grocery_items read" on grocery_items;
drop policy if exists "grocery_items write" on grocery_items;
drop policy if exists "grocery_items update" on grocery_items;
drop policy if exists "grocery_items delete" on grocery_items;
create policy "grocery_items read"   on grocery_items for select using (true);
create policy "grocery_items write"  on grocery_items for insert with check (true);
create policy "grocery_items update" on grocery_items for update using (true);
create policy "grocery_items delete" on grocery_items for delete using (true);
