# PHASE 06 — Check-in, readiness, and derived-metrics engine
Read CONTRACTS §B(checkins/daily_metrics) and the Recovery spec.

## Goal
The morning check-in produces a readiness score; a pure metrics engine computes all derived values; a nightly Render cron recomputes them server-side. This is the data backbone Analytics and Coach depend on.

## Deliverables
1. Check-in flow (bottom sheet): sleep (auto-suggest from Health API where permitted, else manual), quality, soreness body-map, energy, stress, RHR → writes `checkins` via outbox → triggers readiness recompute.
2. **Metrics engine** in `packages/shared` (pure functions, exhaustively unit-tested): readiness (weighted sleep/RHR/soreness/prior-load with the transparent weights from the spec), session load, acute:chronic ratio, est-1RM per lift from set_logs, Z2 pace-at-HR, weekly run volume, zone distribution, Hybrid Score (5 sub-scores + composite), Trek Readiness (component checklist), consistency, streaks. Each function has documented inputs/outputs and edge-case tests (missing data → typed nulls, never NaN).
3. Recovery screen: readiness ring + one-line driver + transparent breakdown sheet, sleep card, RHR card, soreness map, load-vs-readiness combo chart, deload status, wind-down (last-tea) tracker. Auto-ease rule surfaced ("RHR +7 → today eased") linking to what changed.
4. **Render cron** `/internal/recompute-metrics` (service-role, not browser-callable): nightly recompute of `daily_metrics` for all users; idempotent; logged. Client also recomputes optimistically after a check-in so the UI is instant.

## Gate
Universal Gate green. Metrics engine unit tests cover every function incl. sparse-data cases. A check-in updates readiness immediately client-side and the cron reproduces identical values server-side (parity test). axe passes.
