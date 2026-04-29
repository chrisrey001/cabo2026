-- Phase 4 migration — run this in Supabase SQL editor on an existing Phase 3 database.
-- Adds reservation tracking: who actually booked it, and when.
-- NULL on both columns = not yet booked.

alter table activities  add column if not exists confirmed_by text;
alter table activities  add column if not exists confirmed_at timestamptz;

alter table restaurants add column if not exists confirmed_by text;
alter table restaurants add column if not exists confirmed_at timestamptz;
