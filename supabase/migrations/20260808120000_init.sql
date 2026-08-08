create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  units jsonb not null default '{"mass":"kg","distance":"km","food":"katori"}',
  flags jsonb not null default '{}',
  targets jsonb not null default '{}',
  settings jsonb not null default '{}',
  identity_line text,
  created_at timestamptz not null default now()
);

create table exercises (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  pattern text not null,
  equipment text[] not null default '{}',
  cues jsonb not null default '[]',
  substitutions jsonb not null default '[]',
  pain_safe_for text[] not null default '{}',
  media_url text
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  start_date date not null,
  structure jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  program_id uuid references programs on delete set null,
  date date not null,
  type text not null,
  title text not null,
  planned jsonb not null,
  status text not null default 'upcoming',
  session_rpe numeric,
  energy int,
  pump int,
  note text,
  started_at timestamptz,
  finished_at timestamptz,
  client_id text unique,
  created_at timestamptz not null default now()
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid not null references sessions on delete cascade,
  exercise_id text not null references exercises,
  set_no int not null,
  weight_kg numeric,
  reps int,
  rpe numeric,
  tempo text,
  is_warmup boolean not null default false,
  is_dropset boolean not null default false,
  pain jsonb,
  note text,
  client_id text unique,
  logged_at timestamptz not null default now()
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  type text not null,
  distance_m int,
  duration_s int,
  avg_hr int,
  max_hr int,
  cadence int,
  elev_gain_m int,
  splits jsonb,
  zones jsonb,
  weather jsonb,
  gps_ref text,
  shoe_id uuid,
  rpe numeric,
  note text,
  client_id text unique,
  created_at timestamptz not null default now()
);

create table shoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  km_used numeric not null default 0,
  km_limit numeric not null default 700,
  retired boolean not null default false
);

alter table runs
  add constraint runs_shoe_id_fkey foreign key (shoe_id) references shoes (id) on delete set null;

create table foods (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  unit_label text not null,
  protein_g numeric not null,
  kcal numeric not null,
  is_staple boolean not null default false,
  sort int not null default 0
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ts timestamptz not null default now(),
  food_id text not null references foods,
  portions numeric not null default 1,
  protein_g numeric not null,
  kcal numeric not null,
  client_id text unique
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  sleep_h numeric,
  quality int,
  energy int,
  stress int,
  rhr int,
  soreness jsonb not null default '[]',
  unique (user_id, date)
);

create table measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  site text not null,
  value_cm numeric not null
);

create table body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  pose text not null,
  storage_ref text not null
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  schedule jsonb not null default '{}',
  sort int not null default 0
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  habit_id uuid not null references habits on delete cascade,
  date date not null,
  done boolean not null default false,
  paused boolean not null default false,
  unique (habit_id, date)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null,
  target jsonb not null,
  deadline date,
  status text not null default 'active'
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  badge_key text not null,
  tier text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table daily_metrics (
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  readiness int,
  load numeric,
  acr numeric,
  hybrid jsonb,
  trek_readiness int,
  primary key (user_id, date)
);

create table dashboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default 'Home',
  config jsonb not null,
  is_default boolean not null default true,
  updated_at timestamptz not null default now()
);

create table plan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ts timestamptz not null default now(),
  source text not null,
  diff jsonb not null,
  reverted boolean not null default false
);

create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  role text not null,
  content text not null,
  actions jsonb,
  applied_event_id uuid references plan_events,
  created_at timestamptz not null default now()
);
