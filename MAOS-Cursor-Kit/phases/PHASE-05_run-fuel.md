# PHASE 05 — Running + Nutrition logging
Read CONTRACTS §B(runs/shoes/meals/foods) and the Running + Nutrition specs. Reuse the Phase-04 sync layer.

## Goal
Complete, offline-capable running and nutrition logging — Strava/Garmin depth for runs, protein-first speed for food.

## Deliverables — Running
1. Run hub: weekly mileage (planned ghost vs actual), 80/20 easy/quality donut, zone-time bar, this-week plan list from program, recent runs, shoe manager (km accrual, retire at limit).
2. Log run — **post-hoc form** (distance, time → auto pace; optional HR/cadence/elevation; type auto-suggested from plan; weather auto-filled from geolocation+time via a weather source; shoe defaults to last, mileage increments) and **live run** (mobile: GPS, big pace/HR/time, auto-lap per km, lock slider, hold-to-finish, AMOLED variant). Both write via the sync outbox.
3. Run detail: map (or type glyph if manual), mono stat grid, splits table, zone bar, pace/HR chart with zone bands, coach-note slot. Text alternative for the map (a11y).

## Deliverables — Nutrition
4. Protein-first Fuel screen: protein hero bar to target (from `profiles.targets`), staple grid (12 seeded foods; tap = default portion via outbox + undo toast; long-press = portion stepper), today's log grouped by time with swipe-delete, water dots, meal templates (one-tap sets), end-of-day protein-gap nudge. No barcode, no search-first, no micronutrient tables — per the anti-MyFitnessPal contract.

## Gate
Universal Gate green. **E2E:** log a post-hoc run and three meals offline, reconnect, verify persistence + shoe km increment + protein total. Weather auto-fill degrades gracefully offline (field left editable, no crash). axe passes.
