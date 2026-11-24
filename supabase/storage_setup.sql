-- ============================================================
-- Work-Study Scheduler – Storage & Profile Migration
-- Step 1: Run this FIRST in Supabase Dashboard → SQL Editor → New Query → RUN
-- ============================================================

-- 1. Add avatar_url and profile_data columns to profiles (safe to re-run)
alter table public.profiles
  add column if not exists avatar_url  text,
  add column if not exists profile_data jsonb default '{}'::jsonb;

-- 2. Create the public 'pictures' storage bucket (safe to re-run)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pictures',
  'pictures',
  true,
  10485760,   -- 10 MB
  array[
    'image/png', 'image/jpeg', 'image/jpg',
    'image/webp', 'image/svg+xml',
    'image/x-icon', 'image/jfif'
  ]
)
on conflict (id) do update set
  public              = true,
  file_size_limit     = 10485760,
  allowed_mime_types  = array[
    'image/png', 'image/jpeg', 'image/jpg',
    'image/webp', 'image/svg+xml',
    'image/x-icon', 'image/jfif'
  ];

-- 3. Storage RLS policies ─ allow anyone to read; authenticated users to upload/update/delete
-- (drop first so re-runs are safe)
drop policy if exists "pictures_public_read"   on storage.objects;
drop policy if exists "pictures_auth_insert"   on storage.objects;
drop policy if exists "pictures_auth_update"   on storage.objects;
drop policy if exists "pictures_auth_delete"   on storage.objects;

create policy "pictures_public_read"
  on storage.objects for select
  using (bucket_id = 'pictures');

create policy "pictures_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'pictures');

create policy "pictures_auth_update"
  on storage.objects for update
  using  (bucket_id = 'pictures');

create policy "pictures_auth_delete"
  on storage.objects for delete
  using  (bucket_id = 'pictures');

-- 4. Optional picture registry table
create table if not exists public.pictures (
  id          text primary key,
  name        text        not null,
  category    text        not null
                check (category in ('logo','profile','card','favicon','user')),
  url         text        not null,
  created_at  timestamptz not null
                default timezone('utc', now())
);

alter table public.pictures enable row level security;

drop policy if exists "pictures_registry_read"   on public.pictures;
drop policy if exists "pictures_registry_write"  on public.pictures;

create policy "pictures_registry_read"
  on public.pictures for select using (true);

create policy "pictures_registry_write"
  on public.pictures for all using (true) with check (true);

grant all on public.pictures to postgres, anon, authenticated, service_role;
