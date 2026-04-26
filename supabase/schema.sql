-- Run this in your Supabase project: SQL Editor → New Query → paste → Run

-- Enable RLS on all tables (users can only see their own data)

create table if not exists habits (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null default auth.uid(),
  name        text        not null,
  icon        text        not null,
  color       text        not null,
  type        text        not null,  -- toggle | counter | tracker | parent
  category    text        not null default 'own-row',
  target      int         default 1,
  time_pref   text        default 'all',
  description text,
  created_at  timestamptz default now()
);
alter table habits enable row level security;
create policy "own habits" on habits for all using (auth.uid() = user_id);

create table if not exists habit_logs (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null default auth.uid(),
  habit_id    text        not null,  -- uuid for custom habits, or builtin key like 'water'
  value       int         default 1,
  date        date        default current_date,
  logged_at   timestamptz default now(),
  unique (user_id, habit_id, date)
);
alter table habit_logs enable row level security;
create policy "own logs" on habit_logs for all using (auth.uid() = user_id);

create table if not exists todos (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users not null default auth.uid(),
  text         text        not null,
  completed_at timestamptz,
  created_at   timestamptz default now()
);
alter table todos enable row level security;
create policy "own todos" on todos for all using (auth.uid() = user_id);

create table if not exists weight_logs (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null default auth.uid(),
  weight_kg   numeric(5,1) not null,
  logged_at   timestamptz default now()
);
alter table weight_logs enable row level security;
create policy "own weight" on weight_logs for all using (auth.uid() = user_id);

create table if not exists notes (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null default auth.uid(),
  text        text        not null,
  created_at  timestamptz default now()
);
alter table notes enable row level security;
create policy "own notes" on notes for all using (auth.uid() = user_id);
