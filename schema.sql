-- ==========================================
-- DISCIPLINEAR DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor.
-- ==========================================

-- 1. habits Table
create table if not exists public.habits (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    emoji text,
    type text not null check (type in ('task', 'amount', 'timer')),
    mode text not null check (mode in ('build', 'quit')),
    color text not null,
    frequency text not null, -- JSON string representation
    target_value numeric,
    unit text,
    start_date date not null,
    end_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on habits
alter table public.habits enable row level security;

-- Policies for habits
create policy "Users can perform all actions on their own habits"
    on public.habits
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 2. habit_logs Table
create table if not exists public.habit_logs (
    id uuid default gen_random_uuid() primary key,
    habit_id uuid references public.habits(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    log_date date not null,
    is_completed boolean not null,
    value numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(habit_id, log_date)
);

-- Enable RLS on habit_logs
alter table public.habit_logs enable row level security;

-- Policies for habit_logs
create policy "Users can perform all actions on their own logs"
    on public.habit_logs
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 3. user_settings Table
create table if not exists public.user_settings (
    user_id uuid references auth.users(id) on delete cascade primary key,
    theme text default 'dark',
    bg_image_url text,
    bg_blur numeric default 10,
    bg_opacity numeric default 20,
    display_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_settings
alter table public.user_settings enable row level security;

-- Policies for user_settings
create policy "Users can perform all actions on their own settings"
    on public.user_settings
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 4. Auth Sign Up Trigger for user_settings initialization
-- Automatically creates a user_settings profile when a new user registers.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists, then create it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
