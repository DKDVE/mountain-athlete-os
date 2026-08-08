# PHASE 01 — Database, RLS, types, and seed
Read CONTRACTS §B/§C. This phase makes the data layer real and safe.

## Goal
The full schema exists in Supabase as ordered migrations with RLS on every user-owned table, TypeScript types generated, shared Zod schemas complete, and the app seeded with the real Mountain Athlete OS content.

## Deliverables
1. Migrations under `supabase/migrations` implementing every table in CONTRACTS §B exactly, with the RLS pattern applied to all user-owned tables (exercises/foods allow global rows). Forward-only migrations.
2. `supabase gen types typescript` wired to a script; generated types committed to `packages/shared/src/db.types.ts`.
3. Complete the Zod schemas in `packages/shared` for every domain entity in CONTRACTS §C/§D (Session, SetLog, Run, Meal, Checkin, Measurement, Goal, DashboardConfig, WidgetInstance, CoachAction). Each infers its TS type; export a barrel.
4. Seed script (idempotent): the exercise library (movements referenced by the training system with cues/substitutions/pain-safe tags), the 12 staple foods with protein/kcal, and a factory that generates the **12-week program `structure` JSON** (3 mesocycles, weekly template, deloads at wk 4/8/12) plus the first week's `sessions` rows for a given start date. Seed runs against a local/dev project, not prod-by-accident.
5. Storage bucket for `body_photos`, private, RLS-scoped.
6. Tests: Zod round-trip tests; a **security test** using two test users proving user B's queries return zero of user A's rows for every user-owned table (parametrized).

## Guardrails
No app UI in this phase. Program-structure factory must match the training system's mesocycle/deload logic — this is domain data, get it right, no placeholders.

## Gate
Universal Gate green + the RLS isolation test passes for every table. Running the seed produces a queryable 12-week program and week-1 sessions. Paste the seed output summary.
