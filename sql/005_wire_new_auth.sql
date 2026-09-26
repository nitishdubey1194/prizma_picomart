-- Stub auth.jwt() so any policy still referencing it can be CREATEd without
-- erroring (Postgres validates function existence at policy-creation time).
-- Returns null claims for now, which makes those policies evaluate to
-- false/deny rather than error - a safe default (locks down, doesn't expose).
create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select nullif(current_setting('app.current_user_claims', true), '')::jsonb;
$$;

-- Replicates Supabase's original behavior: a trigger on auth.users called
-- assign_default_role() to give every new signup the 'customer' role
-- automatically. That trigger lived on Supabase's auth.users table, which
-- no longer exists - this recreates the same behavior on our own users table.
create trigger on_user_created
  after insert on public.users
  for each row execute function public.assign_default_role();
