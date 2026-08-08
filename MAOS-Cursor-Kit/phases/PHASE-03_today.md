# PHASE 03 — Program domain + Today (read path)
Read CONTRACTS §B (programs/sessions) and the Today screen spec.

## Goal
The user opens the app and sees today's real session and context, sourced from seeded data — the read path proven before the write path.

## Deliverables
1. `features/program`: TanStack Query hooks to load the active program, the current week/meso context, and today's `sessions` row(s). Derive week#, meso name, deload flag from the program structure.
2. Today screen exactly per spec: greeting + week/meso chips, readiness ring (reads latest `daily_metrics`, empty state if none), SessionCard hero (title, type, exercise preview, duration estimate, Start button routing to logger route — button present, logger built next phase), check-in card entry point, three metric cards (protein today, weekly load, streak — each with empty state until data exists), coach-tip slot (static until Phase 09), tomorrow preview after a time threshold.
3. All Today states implemented: new-user empty (start Week 1), loading skeletons in exact layout, offline (cached), rest day (recovery card), deload week (banner).
4. Program hub (`/train/program`) read-only zoom: Macro/Meso/Week views from the structure JSON.

## Guardrails
Read path only — no logging writes yet. No fabricated metric values; where data is absent, show the real empty state, not zeros pretending to be data.

## Gate
Universal Gate green. With the seed loaded, Today shows the correct current session and week/meso; with a fresh user, shows the start-week-1 empty state. Skeleton/loading verified by throttling. axe passes.
