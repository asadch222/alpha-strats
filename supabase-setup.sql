-- Run this once in your Supabase project's SQL editor.
-- It creates: a profile per user (with their plan), a private data box per user
-- (watchlist, alerts), and a table for strategy requests. Each user can only see their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  plan text not null default 'free',        -- 'free', 'pro' or 'elite'. Only you can change it (in the table editor).
  created_at timestamptz default now()
);
create table if not exists public.user_data (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
create table if not exists public.requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  market text, idea text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.requests enable row level security;

-- Users may read their own profile but not edit it (so they cannot give themselves Pro).
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "read own data" on public.user_data for select using (auth.uid() = id);
create policy "insert own data" on public.user_data for insert with check (auth.uid() = id);
create policy "update own data" on public.user_data for update using (auth.uid() = id);
create policy "add own request" on public.requests for insert with check (auth.uid() = user_id);
create policy "read own requests" on public.requests for select using (auth.uid() = user_id);

-- Create the profile automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.user_data (id) values (new.id);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();


-- ============================================================================
-- ADMIN PORTAL  (safe to run on its own if you already ran the part above)
-- Adds: an admin role, and one shared document with the website settings and trades.
-- Everyone can read that document; only an admin can change it.
-- ============================================================================
alter table public.profiles add column if not exists role text not null default 'user';   -- 'user' or 'admin'

create table if not exists public.site_settings (
  id int primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.site_settings enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "anyone reads site settings" on public.site_settings;
drop policy if exists "admin changes site settings" on public.site_settings;
create policy "anyone reads site settings" on public.site_settings for select using (true);
create policy "admin changes site settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- The admin can list members and change their plan from the portal.
drop policy if exists "admin reads profiles" on public.profiles;
drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin reads profiles" on public.profiles for select using (public.is_admin());
create policy "admin updates profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- MAKE YOURSELF THE ADMIN: sign up on the website first, then run this line with your own email.
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
