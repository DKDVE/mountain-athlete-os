-- profiles
alter table profiles enable row level security;
create policy profiles_sel on profiles for select using (id = auth.uid());
create policy profiles_ins on profiles for insert with check (id = auth.uid());
create policy profiles_upd on profiles for update using (id = auth.uid());
create policy profiles_del on profiles for delete using (id = auth.uid());

-- exercises (global + own)
alter table exercises enable row level security;
create policy exercises_sel on exercises for select using (user_id is null or user_id = auth.uid());
create policy exercises_ins on exercises for insert with check (user_id = auth.uid());
create policy exercises_upd on exercises for update using (user_id = auth.uid());
create policy exercises_del on exercises for delete using (user_id = auth.uid());

-- foods (global + own)
alter table foods enable row level security;
create policy foods_sel on foods for select using (user_id is null or user_id = auth.uid());
create policy foods_ins on foods for insert with check (user_id = auth.uid());
create policy foods_upd on foods for update using (user_id = auth.uid());
create policy foods_del on foods for delete using (user_id = auth.uid());

-- programs
alter table programs enable row level security;
create policy programs_sel on programs for select using (user_id = auth.uid());
create policy programs_ins on programs for insert with check (user_id = auth.uid());
create policy programs_upd on programs for update using (user_id = auth.uid());
create policy programs_del on programs for delete using (user_id = auth.uid());

-- sessions
alter table sessions enable row level security;
create policy sessions_sel on sessions for select using (user_id = auth.uid());
create policy sessions_ins on sessions for insert with check (user_id = auth.uid());
create policy sessions_upd on sessions for update using (user_id = auth.uid());
create policy sessions_del on sessions for delete using (user_id = auth.uid());

-- set_logs
alter table set_logs enable row level security;
create policy set_logs_sel on set_logs for select using (user_id = auth.uid());
create policy set_logs_ins on set_logs for insert with check (user_id = auth.uid());
create policy set_logs_upd on set_logs for update using (user_id = auth.uid());
create policy set_logs_del on set_logs for delete using (user_id = auth.uid());

-- runs
alter table runs enable row level security;
create policy runs_sel on runs for select using (user_id = auth.uid());
create policy runs_ins on runs for insert with check (user_id = auth.uid());
create policy runs_upd on runs for update using (user_id = auth.uid());
create policy runs_del on runs for delete using (user_id = auth.uid());

-- shoes
alter table shoes enable row level security;
create policy shoes_sel on shoes for select using (user_id = auth.uid());
create policy shoes_ins on shoes for insert with check (user_id = auth.uid());
create policy shoes_upd on shoes for update using (user_id = auth.uid());
create policy shoes_del on shoes for delete using (user_id = auth.uid());

-- meals
alter table meals enable row level security;
create policy meals_sel on meals for select using (user_id = auth.uid());
create policy meals_ins on meals for insert with check (user_id = auth.uid());
create policy meals_upd on meals for update using (user_id = auth.uid());
create policy meals_del on meals for delete using (user_id = auth.uid());

-- checkins
alter table checkins enable row level security;
create policy checkins_sel on checkins for select using (user_id = auth.uid());
create policy checkins_ins on checkins for insert with check (user_id = auth.uid());
create policy checkins_upd on checkins for update using (user_id = auth.uid());
create policy checkins_del on checkins for delete using (user_id = auth.uid());

-- measurements
alter table measurements enable row level security;
create policy measurements_sel on measurements for select using (user_id = auth.uid());
create policy measurements_ins on measurements for insert with check (user_id = auth.uid());
create policy measurements_upd on measurements for update using (user_id = auth.uid());
create policy measurements_del on measurements for delete using (user_id = auth.uid());

-- body_photos
alter table body_photos enable row level security;
create policy body_photos_sel on body_photos for select using (user_id = auth.uid());
create policy body_photos_ins on body_photos for insert with check (user_id = auth.uid());
create policy body_photos_upd on body_photos for update using (user_id = auth.uid());
create policy body_photos_del on body_photos for delete using (user_id = auth.uid());

-- habits
alter table habits enable row level security;
create policy habits_sel on habits for select using (user_id = auth.uid());
create policy habits_ins on habits for insert with check (user_id = auth.uid());
create policy habits_upd on habits for update using (user_id = auth.uid());
create policy habits_del on habits for delete using (user_id = auth.uid());

-- habit_logs
alter table habit_logs enable row level security;
create policy habit_logs_sel on habit_logs for select using (user_id = auth.uid());
create policy habit_logs_ins on habit_logs for insert with check (user_id = auth.uid());
create policy habit_logs_upd on habit_logs for update using (user_id = auth.uid());
create policy habit_logs_del on habit_logs for delete using (user_id = auth.uid());

-- goals
alter table goals enable row level security;
create policy goals_sel on goals for select using (user_id = auth.uid());
create policy goals_ins on goals for insert with check (user_id = auth.uid());
create policy goals_upd on goals for update using (user_id = auth.uid());
create policy goals_del on goals for delete using (user_id = auth.uid());

-- achievements
alter table achievements enable row level security;
create policy achievements_sel on achievements for select using (user_id = auth.uid());
create policy achievements_ins on achievements for insert with check (user_id = auth.uid());
create policy achievements_upd on achievements for update using (user_id = auth.uid());
create policy achievements_del on achievements for delete using (user_id = auth.uid());

-- daily_metrics
alter table daily_metrics enable row level security;
create policy daily_metrics_sel on daily_metrics for select using (user_id = auth.uid());
create policy daily_metrics_ins on daily_metrics for insert with check (user_id = auth.uid());
create policy daily_metrics_upd on daily_metrics for update using (user_id = auth.uid());
create policy daily_metrics_del on daily_metrics for delete using (user_id = auth.uid());

-- dashboards
alter table dashboards enable row level security;
create policy dashboards_sel on dashboards for select using (user_id = auth.uid());
create policy dashboards_ins on dashboards for insert with check (user_id = auth.uid());
create policy dashboards_upd on dashboards for update using (user_id = auth.uid());
create policy dashboards_del on dashboards for delete using (user_id = auth.uid());

-- plan_events
alter table plan_events enable row level security;
create policy plan_events_sel on plan_events for select using (user_id = auth.uid());
create policy plan_events_ins on plan_events for insert with check (user_id = auth.uid());
create policy plan_events_upd on plan_events for update using (user_id = auth.uid());
create policy plan_events_del on plan_events for delete using (user_id = auth.uid());

-- coach_messages
alter table coach_messages enable row level security;
create policy coach_messages_sel on coach_messages for select using (user_id = auth.uid());
create policy coach_messages_ins on coach_messages for insert with check (user_id = auth.uid());
create policy coach_messages_upd on coach_messages for update using (user_id = auth.uid());
create policy coach_messages_del on coach_messages for delete using (user_id = auth.uid());
