-- ============================================================
-- Add Profile Details Columns to the profiles table
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ============================================================

alter table public.profiles
  add column if not exists role_title text default 'WORKING STUDENT',
  add column if not exists age text,
  add column if not exists residence text,
  add column if not exists student_classification text,
  add column if not exists monthly_rate text,
  add column if not exists school text,
  add column if not exists degree_program text;

-- Optional aliases in case legacy queries use alternate names
alter table public.profiles
  add column if not exists student_type text,
  add column if not exists rate text,
  add column if not exists university text,
  add column if not exists course text;
