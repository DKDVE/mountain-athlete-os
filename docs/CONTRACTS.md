# MAOS — CONTRACTS (frozen source of truth)
Location in repo: `/docs/CONTRACTS.md`. Every phase reads this. Changes only via the Contract change protocol in the rules.

---
## A. Environment variables
```
# apps/web (public, safe to ship in bundle)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=            # Render service URL
VITE_APP_BASE_PATH=/mountain-athlete-os   # GitHub Pages base

# apps/api (Render secrets — never in frontend)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=    # server-only, for cron recompute
SUPABASE_JWT_SECRET=          # to verify caller tokens
OPENROUTER_API_KEY=
OPENROUTER_MODEL_DEFAULT=openrouter/free
OPENROUTER_MODEL_PREMIUM=deepseek/deepseek-v4-flash
ALLOWED_ORIGIN=               # the GitHub Pages origin, for CORS
```

---
## B. Postgres schema + RLS
Apply as ordered migrations. `user_id` + RLS on every user-owned table. Show the RLS pattern once; apply identically to all user-owned tables.

```sql
-- 0001_init.sql
create extension if not exists "pgcrypto";

-- profile extends auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  units jsonb not null default '{"mass":"kg","distance":"km","food":"katori"}',
  flags jsonb not null default '{}',            -- {lowBack:bool, shoulder:bool,...}
  targets jsonb not null default '{}',          -- {kcal:2250, protein_g:130, waist_goal_cm:...}
  settings jsonb not null default '{}',
  identity_line text,
  created_at timestamptz not null default now()
);

-- exercise library: system rows (user_id null) + user rows
create table exercises (
  id text primary key,                          -- slug e.g. 'back-squat'
  user_id uuid references auth.users on delete cascade, -- null = global
  name text not null,
  pattern text not null,                        -- squat|hinge|push|pull|carry|core|calf|skill
  equipment text[] not null default '{}',
  cues jsonb not null default '[]',
  substitutions jsonb not null default '[]',    -- [{id, reason}]
  pain_safe_for text[] not null default '{}',   -- ['shoulder','lowBack']
  media_url text
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  start_date date not null,
  structure jsonb not null,                     -- macro->meso->week->day skeleton
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  program_id uuid references programs on delete set null,
  date date not null,
  type text not null,                           -- lower|upper|fullbody|run|mobility|rest
  title text not null,
  planned jsonb not null,                       -- ordered exercises/intervals with targets
  status text not null default 'upcoming',      -- upcoming|in_progress|done|skipped
  session_rpe numeric, energy int, pump int, note text,
  started_at timestamptz, finished_at timestamptz,
  client_id text unique,                        -- ULID for idempotent offline create
  created_at timestamptz not null default now()
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid not null references sessions on delete cascade,
  exercise_id text not null references exercises,
  set_no int not null,
  weight_kg numeric, reps int, rpe numeric, tempo text,
  is_warmup boolean not null default false,
  is_dropset boolean not null default false,
  pain jsonb,                                   -- {region, severity} or null
  note text,
  client_id text unique,
  logged_at timestamptz not null default now()
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null, type text not null,       -- z2|tempo|interval|long|hike|walkrun
  distance_m int, duration_s int,
  avg_hr int, max_hr int, cadence int, elev_gain_m int,
  splits jsonb, zones jsonb, weather jsonb, gps_ref text,
  shoe_id uuid, rpe numeric, note text,
  client_id text unique,
  created_at timestamptz not null default now()
);

create table shoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null, km_used numeric not null default 0,
  km_limit numeric not null default 700, retired boolean not null default false
);

create table foods (
  id text primary key,
  user_id uuid references auth.users on delete cascade, -- null = global staple
  name text not null, unit_label text not null,         -- 'katori','scoop','250ml'
  protein_g numeric not null, kcal numeric not null,
  is_staple boolean not null default false, sort int not null default 0
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ts timestamptz not null default now(),
  food_id text not null references foods,
  portions numeric not null default 1,
  protein_g numeric not null, kcal numeric not null,
  client_id text unique
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  sleep_h numeric, quality int, energy int, stress int, rhr int,
  soreness jsonb not null default '[]',         -- [{region,severity}]
  unique (user_id, date)
);

create table measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null, site text not null, value_cm numeric not null
);

create table body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null, pose text not null, storage_ref text not null
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null, schedule jsonb not null default '{}', sort int not null default 0
);
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  habit_id uuid not null references habits on delete cascade,
  date date not null, done boolean not null default false, paused boolean not null default false,
  unique (habit_id, date)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null, target jsonb not null, deadline date, status text not null default 'active'
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  badge_key text not null, tier text not null, earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- derived, recomputed nightly (server) + optimistic client recompute
create table daily_metrics (
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  readiness int, load numeric, acr numeric,
  hybrid jsonb,                                 -- {strength,endurance,skill,recovery,consistency,score}
  trek_readiness int,
  primary key (user_id, date)
);

-- dashboard config = the AI-editable UI
create table dashboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default 'Home',
  config jsonb not null,                        -- DashboardConfig (see section D)
  is_default boolean not null default true,
  updated_at timestamptz not null default now()
);

-- audit for every plan/coach change (revertable)
create table plan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ts timestamptz not null default now(),
  source text not null,                         -- coach_auto|coach_chat|user
  diff jsonb not null, reverted boolean not null default false
);
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  role text not null, content text not null,
  actions jsonb, applied_event_id uuid references plan_events,
  created_at timestamptz not null default now()
);

-- athlete onboarding profile (versioned jsonb, validated app-side via AthleteProfile Zod)
create table athlete_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  version int not null default 1,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS PATTERN (apply to EVERY user-owned table above; exercises/foods also allow global rows):
alter table sessions enable row level security;
create policy sel on sessions for select using (user_id = auth.uid());
create policy ins on sessions for insert with check (user_id = auth.uid());
create policy upd on sessions for update using (user_id = auth.uid());
create policy del on sessions for delete using (user_id = auth.uid());
-- exercises/foods select policy: using (user_id is null or user_id = auth.uid());
```

---
## C. Shared Zod schemas / TS types (`packages/shared`)
Derive these from the tables; both apps import them. Illustrative core (Cursor completes the rest 1:1 with the schema):
```ts
export const SetLog = z.object({
  clientId: z.string(),            // ULID
  sessionId: z.string().uuid(),
  exerciseId: z.string(),
  setNo: z.number().int().positive(),
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  tempo: z.string().nullable(),
  isWarmup: z.boolean().default(false),
  isDropset: z.boolean().default(false),
  pain: z.object({ region: z.string(), severity: z.number().min(0).max(10) }).nullable(),
  note: z.string().nullable(),
});
export type SetLog = z.infer<typeof SetLog>;
// Session, Run, Meal, Checkin, Measurement, Goal, DashboardConfig, WidgetInstance all defined the same way.

export const AthleteGoal = z.enum([
  'fat_loss','recomposition','hypertrophy','strength','endurance',
  'hybrid_performance','event_specific','mobility_pain','longevity','glp1_preservation'
]);
export const AthleteProfile = z.object({
  goals: z.array(AthleteGoal).min(1),
  experience: z.enum(['beginner','returning','intermediate','advanced']),
  constraints: z.object({
    daysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(20).max(180),
    equipment: z.array(z.string()),
    schedule: z.string().optional(),
  }),
  screening: z.object({ flags: z.array(z.object({
    flag: z.enum(['cardiac','metabolic','renal','pregnancy','current_injury','recent_surgery','uncontrolled_bp','chronic_condition_other']),
    region: z.string().optional(), note: z.string().optional(),
  })).default([]) }),
  preferences: z.object({
    likedMovements: z.array(z.string()).default([]),
    dislikedMovements: z.array(z.string()).default([]),
    dietaryPattern: z.string().nullable().optional(),
    wearableOwned: z.string().nullable().optional(),
  }),
  metricsSnapshot: z.object({
    heightCm: z.number().positive().nullable().optional(),
    weightKg: z.number().positive().nullable().optional(),
    waistCm: z.number().positive().nullable().optional(),
    currentLifts: z.record(z.string(), z.object({ weightKg: z.number().nullable(), reps: z.number().int().nullable() })).optional(),
  }).default({}),
});
export type AthleteProfile = z.infer<typeof AthleteProfile>;
```

---
## D. Dashboard widget registry (the AI-editable UI contract)
The dashboard is data, not code. AI and the manual editor both only ever produce a `DashboardConfig` JSON, validated by Zod, rendered by a fixed registry of widgets. AI can never emit code.

```ts
export const WIDGET_TYPES = [
  'stat_card','line_trend','bars_vs_target','ring','segmented_ring',
  'zone_bar','heatmap','table','combo_load_readiness','radar_hybrid',
  'gauge','streak','coach_tip','photo_slider'
] as const;

export const DATA_SOURCES = [
  'weight','waist','bodyfat','protein_daily','kcal_daily','sleep',
  'rhr','readiness','weekly_load','acr','est_1rm','z2_pace',
  'run_volume','zone_distribution','hybrid_score','trek_readiness',
  'consistency','streak_mobility','pr_list','habit_week'
] as const;

export const WidgetInstance = z.object({
  id: z.string(),                                  // ULID
  type: z.enum(WIDGET_TYPES),
  dataSource: z.enum(DATA_SOURCES).nullable(),     // null for coach_tip
  title: z.string(),
  options: z.record(z.string(), z.any()).default({}), // {range:'12w', series:['squat'], goalLine:130}
  grid: z.object({ x:z.number(), y:z.number(), w:z.number(), h:z.number() }), // 12-col grid units
});
export const DashboardConfig = z.object({
  version: z.literal(1),
  widgets: z.array(WidgetInstance).max(24),
});
export type DashboardConfig = z.infer<typeof DashboardConfig>;
```
Rules the code enforces: unknown `type`/`dataSource` → rejected by Zod. Every `dataSource` maps to a typed selector in `features/metrics/selectors` returning a shape the widget renders. Adding a metric = add a source id + a selector + (optionally) a widget; never touch AI code.

---
## E. Render API contract (`apps/api`)
All routes require `Authorization: Bearer <supabase jwt>`; server verifies with `SUPABASE_JWT_SECRET`, derives `user_id`, and scopes any data access with the service role. CORS: `ALLOWED_ORIGIN` only. All responses: `{ ok: true, data } | { ok: false, error: { code, message, retryable } }`.
```
GET  /health                         -> { ok, data:{ uptime } }
POST /coach/chat
  body:  { message: string, context: CoachContext }   // context assembled client-side
  reply: { ok, data:{ message: string, actions: CoachAction[] } }  // schema-validated
POST /coach/import-routine
  body:  { text: string }
  reply: { ok, data:{ program?: ProgramDraft, meals?: MealDraft[], preview: DiffPreview } }
POST /dashboard/ai-edit
  body:  { instruction: string, current: DashboardConfig, availableSources: string[] }
  reply: { ok, data:{ next: DashboardConfig, changeSummary: string } } // validated to DashboardConfig or error
POST /onboarding/parse-profile
  body:  { text: string }
  reply: { ok, data:{ profile: AthleteProfile } } | { ok:false, error:{ code:'AI_SCHEMA', retryable:true } }
  model: OPENROUTER_MODEL_PREMIUM, response_format json_schema → Zod re-validate
POST /internal/recompute-metrics     // cron only, service-role guarded, not called by browser
```
`CoachAction` (structured, schema-enforced, validated before apply): 
```
{ kind:'swap_exercise'|'scale_session'|'move_session'|'set_flag'|'message_only',
  payload: {...}, humanSummary: string }
```
The proxy passes `response_format:{type:'json_schema', json_schema:<the matching schema>}` to OpenRouter and **re-validates** the model output with Zod. Invalid → `{ok:false,error:{code:'AI_SCHEMA', retryable:true}}`. Client shows retry; never applies unvalidated output.

---
## F. Sync / offline contract
- Client writes go to Dexie first + an `outbox` table `{clientId, table, op, payload, ts}`, then optimistic UI update, then flush to Supabase.
- Idempotency: every insert carries `client_id` (ULID); Supabase unique constraint makes retries safe.
- Reconnect: flush outbox oldest-first; on 23505 (unique) treat as already-applied success.
- Conflict policy: single-user data, last-write-wins per field; server `updated_at` wins ties. Log conflicts to console + a `sync_events` dev table (dev only).
