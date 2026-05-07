-- Cabo Bot realtime migration — run this in Supabase SQL editor.
-- Adds the activities/restaurants tables and their vote+comment children
-- to the supabase_realtime publication so the frontend can subscribe to
-- INSERT / UPDATE / DELETE events without polling.
--
-- Each block is wrapped to be safe to re-run.

do $$
begin
  alter publication supabase_realtime add table activities;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table restaurants;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table activity_votes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table restaurant_votes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table activity_comments;
exception when duplicate_object then null;
end $$;
