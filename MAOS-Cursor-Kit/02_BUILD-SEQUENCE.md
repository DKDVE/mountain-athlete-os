# Build Sequence & Gates

Each phase is a single Cursor task. Do not begin a phase until the prior Gate is green on your machine and the deploy is live.

Universal Gate (append mentally to every phase; a phase is done only when ALL pass):
```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Plus: new logic has tests; loading/empty/error states exist; a11y checks pass on interactive UI; offline works where the phase touches logging; the GitHub Pages + Render deploys are updated and load without console errors.

| Phase | Ships (must be fully working, not stubbed) | Special gate |
|---|---|---|
| 00 | Monorepo, tooling, CI, live skeleton on Pages + Render `/health` | Both URLs load; CI green on PR |
| 01 | Full schema + RLS migrations, generated types, shared Zod, seed (12-wk program + staple foods + exercise library) | RLS test: user B cannot read user A's rows |
| 02 | Auth (email OTP + Google), app shell, routing, design tokens, base component library from Stitch exports | Login→logout works; axe passes on shell |
| 03 | Program domain + Today screen (read path) with real seeded data | Today renders today's session from DB |
| 04 | Workout Logger — offline write path + rest timer + pain + supersets/dropsets + finish summary + sync | E2E: log a full session offline, reconnect, it persists |
| 05 | Running (live + post-hoc) + Nutrition (protein-first) logging, both offline-capable | E2E: log run + meal offline→sync |
| 06 | Check-in flow + readiness engine + nightly derived-metrics recompute (Render cron) | Readiness recomputes; values match unit tests |
| 07 | Config-driven dashboard: registry, grid renderer, manual editor (add/remove/resize/reorder), persistence | Editing writes valid DashboardConfig; invalid rejected |
| 08 | All analytics widgets + metric selectors populating the registry | Every DATA_SOURCE has a tested selector + widget |
| 09 | AI Coach: Render proxy → OpenRouter structured output, apply engine (revertable), routine import, AI dashboard edit | E2E: "add waist chart" edits dashboard via AI, validated |
| 10 | Habits, mobility player, photos, gamification, goals, settings, PWA/offline hardening, full QA + Lighthouse ≥90 | Lighthouse PWA+Perf ≥90; all critical E2E green |
