-- ============================================================
-- Insert User and Profile directly into Supabase
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  -- 1. Create or confirm user in auth.users
  if not exists (select 1 from auth.users where email = 'sirdenmarkduero@gmail.com') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'sirdenmarkduero@gmail.com',
      crypt('Password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Denmark Duero","username":"Denmark","plan":"free"}',
      now(),
      now()
    );
  else
    select id into new_user_id from auth.users where email = 'sirdenmarkduero@gmail.com';
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now()),
        encrypted_password = crypt('Password123', gen_salt('bf'))
    where id = new_user_id;
  end if;

  -- 2. Insert into public.profiles
  insert into public.profiles (id, name, username, email, plan, created_at, updated_at)
  values (
    new_user_id,
    'Denmark Duero',
    'Denmark',
    'sirdenmarkduero@gmail.com',
    'free',
    now(),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    username = excluded.username,
    plan = excluded.plan,
    updated_at = now();

end $$;
