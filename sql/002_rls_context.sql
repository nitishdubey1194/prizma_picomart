-- Replicates Supabase's auth.uid() by reading a per-request session setting.
-- Existing RLS policies that call auth.uid() keep working with zero changes.
create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- A non-superuser role for the API to connect as. RLS is NOT enforced for
-- table owners or superusers, so the app must NOT connect as the owner
-- role (picomart) once RLS matters.
create role app_user with login password 'Picomart@123$#';

grant usage on schema public to app_user;
grant usage on schema auth to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;