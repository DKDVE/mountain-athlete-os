# PHASE 10 — Remaining features, PWA/offline hardening, release QA
Read the specs for Habits, Mobility, Photos, Gamification, Goals, Settings. Finish the product to prod grade.

## Goal
Everything in the spec is shipped, the app is a hardened installable PWA, and the whole system passes a release QA bar. No loose ends.

## Deliverables
1. **Habits** (rows, 7-dot week, streaks with honest pause), **Mobility** (daily-10 player with per-drill timers + audio-guided option, rehab protocol players), **Progress Photos** (capture with silhouette overlay, before/after slider, onion-skin; encrypted storage; excluded from any AI context by default), **Body/Measurements** wizard, **Goals** (create + projection status computed from selectors), **Achievements/Gamification** (levels as ascent, badges with real unlock criteria checked against data, milestone moment once), **Settings** (units, training/deload policy, notifications + quiet hours, integrations: Strava import + Health read, data export CSV/JSON, appearance, full accessibility controls incl. left-hand mode, account delete with grace).
2. **PWA hardening:** offline app shell + cached active program/routine media; Web Push (VAPID) via service worker for check-in/session/protein nudges, scheduled from Render cron; install prompts; update flow.
3. **Multi-user readiness:** verify RLS end-to-end with two real accounts across every feature (a friend can sign up and use it in isolation). No cross-tenant leakage anywhere.
4. **Release QA pass:** all critical Playwright E2E green (log workout, log run, log meal, check-in, AI dashboard edit, offline→sync). Lighthouse PWA ≥ 90 and Performance ≥ 90 on the deployed build. axe clean on all interactive screens. Bundle budgets met (route JS < 200KB gz). No console errors/warnings on any route. `/docs` updated (CONTRACTS reflects final schema, README deploy runbook current).

## Gate
Every item above verified and pasted: the E2E suite result, Lighthouse scores, axe results, the two-user isolation check, and both live URLs. Any red item means Phase 10 is not done — fix, don't defer.
