-- ============================================================
-- Supabase Auth & Schema Repair Script
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ============================================================

-- 1. Remove the incomplete user record so it can be cleanly created by Supabase Auth
delete from auth.users where email = 'sirdenmarkduero@gmail.com';
delete from public.profiles where email = 'sirdenmarkduero@gmail.com';

-- 2. Grant permissions to supabase_auth_admin and all roles
grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on all tables in schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on all routines in schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role, supabase_auth_admin;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role, supabase_auth_admin;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 3. Ensure handle_new_user trigger function has secure search path and execution rights
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, name, username, email, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'plan', 'free')
  )
  on conflict (id) do update set
    name = excluded.name,
    username = excluded.username,
    plan = excluded.plan,
    updated_at = now();
  return new;
end;
$$;

grant execute on function public.handle_new_user() to postgres, anon, authenticated, service_role, supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
