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
