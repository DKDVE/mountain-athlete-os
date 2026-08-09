-- athlete_profiles: versioned, validated onboarding profile (jsonb validated app-side via Zod)
create table athlete_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  version int not null default 1,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index athlete_profiles_updated_at_idx on athlete_profiles (updated_at);

alter table athlete_profiles enable row level security;
create policy athlete_profiles_sel on athlete_profiles for select using (user_id = auth.uid());
create policy athlete_profiles_ins on athlete_profiles for insert with check (user_id = auth.uid());
create policy athlete_profiles_upd on athlete_profiles for update using (user_id = auth.uid());
create policy athlete_profiles_del on athlete_profiles for delete using (user_id = auth.uid());
