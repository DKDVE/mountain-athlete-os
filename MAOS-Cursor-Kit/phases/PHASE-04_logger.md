# PHASE 04 — Workout Logger (flagship: offline write path + sync)
Read CONTRACTS §B(set_logs/sessions), §F(sync), and the Workout Logger spec. This is the most important screen; build it to spec, fully.

## Goal
The best possible one-thumb, offline-first workout logger, with a real sync outbox, tested end to end.

## Deliverables
1. **Sync foundation (CONTRACTS §F):** Dexie mirror + `outbox`; a mutation layer that writes local-first with a ULID `client_id`, updates UI optimistically, and flushes to Supabase; reconnect flush oldest-first; 23505 treated as success; connectivity + pending-count surfaced in the offline banner. Unit-tested with a simulated offline→online cycle.
2. **Session mode UI** per spec: collapsed header (progress x/n, elapsed timer, ⋮ menu), ExerciseHero (name, info→exercise drawer, target line, last-time line), set table with current-row steppers, complete-set (Enter/tap) → success flash → auto rest-timer.
3. **Rest timer** overlay: 160 ring, mono countdown, ±15s, skip, `aria-live` announcements at 30/10/0, haptics where available, collapses to floating pill on scroll, persists if user navigates away.
4. **Suggested-weight engine** in `packages/shared` (pure, unit-tested): double-progression + readiness downgrade per the training system rules; shown as a ghost value; user override captured and used to inform next suggestion.
5. Set-row extras: note (text), pain flag → body-map sheet (region+severity → `set_logs.pain`), dropset (chained sub-row, −20% suggested), warm-up rows excluded from tonnage.
6. Supersets: grouped exercises share one rest timer; A1/A2 toggle.
7. **Finish flow:** summary (duration, tonnage, PRs vs history, per-exercise deltas), required session-RPE, energy/pump quick pick, note → writes session + marks done → returns to Today with protein nudge.
8. Exercise detail drawer/page: cues, history chart, substitutions.
9. Resume-after-crash: reopening restores exact in-progress state from Dexie.

## Gate
Universal Gate green. **Playwright E2E:** start today's session, log multiple exercises with sets/RPE/pain/a dropset entirely offline, kill connectivity mid-session and restore it, confirm all rows persist in Supabase with correct values and no duplicates. Suggested-weight engine unit tests cover progression + downgrade + override. axe passes on logger + timer.
