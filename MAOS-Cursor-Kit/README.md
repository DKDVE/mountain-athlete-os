# Mountain Athlete OS — Cursor Build Kit

You are the operator; Cursor Pro is the builder; these files are the brain.

## How to use this kit (do not skip the order)

1. **Paste `00_PROJECT-RULES.md` into Cursor Project Rules** (Settings → Rules, or save as `.cursor/rules/maos.mdc`). This is inherited by every prompt. It defines the stack, conventions, and the anti-patchwork quality gates.
2. **Commit `01_CONTRACTS.md` into the repo at `/docs/CONTRACTS.md`** in Phase 0. It is the single source of truth for schema, types, API, and the widget registry. Every phase reads from it. **Contracts are frozen** — a phase may extend them only via the "Contract change" protocol in the rules.
3. **Run phases in order** (`phases/PHASE-00` … `PHASE-10`). Paste one phase prompt into Cursor as a single task. Do not start a phase until the previous phase passes its Gate.
4. After each phase, run the Gate command block yourself. If it isn't green, the phase is not done — reply to Cursor with the failing output, don't move on.

## Why this prevents patchwork
- **Contracts first:** schema, API shapes, and TS types are fixed up front, so phases can't drift into incompatible designs.
- **Vertical slices:** each phase ships one complete, tested, deployed capability — never a stub "to wire up later."
- **Hard gates:** every phase must end green on typecheck + lint + test + build, with tests for the logic it introduced. "Done" is defined observably, not by vibes.
- **Deploy on day one:** Phase 0 ships a live skeleton to GitHub Pages + Render before any feature exists, so integration risk is paid down first, not last.

## Build order at a glance
0 Repo, CI, deploy pipeline (live skeleton) →
1 Supabase schema + RLS + types + seed →
2 Auth + shell + design system + base components →
3 Program + Today (read path) →
4 Workout Logger (offline write path + sync) →
5 Running + Nutrition →
6 Check-in + readiness + derived-metrics engine →
7 Config-driven dashboard (widget registry + editor) →
8 Analytics widgets →
9 AI Coach (proxy + OpenRouter + apply engine + routine import) →
10 Habits, mobility, photos, gamification, settings, PWA/offline hardening, release QA
