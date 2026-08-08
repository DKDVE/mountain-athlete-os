# MAOS — DESIGN-LOCK (content & responsive truth)

Every screen — built in code or mocked in Stitch — must obey this. It exists because early Stitch mockups drifted into generic bodybuilding content. The component library + this file are the consistency engine, **not** Stitch output.

## 1. Domain content truth (never override with generic fitness content)

- **Units: metric only.** Mass = kg, distance = km, length = cm, food = katori/g. Never lbs/mi. The **same** units on every breakpoint.
- **Protein target: 130 g/day.** Calorie target ~2250. (From `profiles.targets`, not hardcoded.)
- **Program blocks are the mountain-athlete mesocycles:** Rebuild (wk 1–4), Build (wk 5–8), Perform (wk 9–12). NEVER "Hypertrophy Block." Deloads at wk 4/8/12.
- **Session names come from the seed/program:** Lower A, Lower B, Upper, Z2 Run, Long Run, Mobility, Rest. Session copy reflects the training system (RPE caps, tempo, trek-specific intent) — NOT invented cues like "quad dominance."
- **Metrics actually collected (check-in):** sleep hours, sleep quality, energy, stress, resting HR, soreness (body-map). **Readiness** is derived from these. **There is NO HRV** unless a wearable integration provides it — do not show an HRV field on Today or Recovery in v1. If a wearable is added later, HRV becomes an optional, clearly-sourced card.
- **All displayed values bind to real data** (seed, logs, `daily_metrics`). Where data is absent, render the real EmptyState — never invented numbers.

## 2. Responsive truth (mobile-first, phone is the primary device)

- **Design and build phone-up.** Base viewport 375px; scale to tablet then desktop. Never desktop-first.
- **Gate breakpoints (all must be verified): 375 / 768 / 1200.**
  - &lt;768: bottom tab bar (5 slots incl. center FAB), single-column card stack, sidebar hidden.
  - 768–1199: 8-col grid, cards 2-up, collapsible rail.
  - ≥1200: 240px sidebar, 12-col, cards 3-up+.
- **No fixed desktop-only widths.** Login card, dashboard cards, and sheets all reflow to full-width on mobile with 16px margins.
- **Touch targets ≥44px.** Primary actions in the bottom thumb zone on mobile.

Desktop must not have large dead zones: sparse phases are acceptable temporarily, but the config-driven dashboard (Phase 7–8) fills the grid; don't ship a permanently half-empty desktop Today.

## 3. Stitch's role (bounded)

- Stitch = **visual/layout reference for a few flagship screens only** (max 3 more: Workout Logger, Analytics cockpit, Run detail). Prompt it **mobile-first** (start at 375px).
- Stitch output is **aesthetic reference, never content or data truth.** Cursor rebuilds every screen from the Phase-2 component library, binding real data, obeying §1–§2 above.
- Do NOT attempt to generate all ~20 screens in Stitch — its cross-screen inconsistency (e.g. kg vs lbs between mobile and desktop comps) is a feature-drift risk. The screen spec (`MAOS-Design-Spec` files 05–10) is the per-screen source; the component library enforces consistency.

## 4. Consequence for the build

Every remaining screen is delivered as a **real, working, responsive page in its phase** (3–10), fully functional at completion — not a placeholder shell created early. "Full product UI for all pages" is achieved by the phased functional build on top of the locked design system, not by a pile of static mockups.

## 5. Implementation checklist (for PR review)

| Check | Pass criteria |
|-------|----------------|
| Mesocycle names | Rebuild / Build / Perform only |
| Session titles | Lower A, Lower B, Upper, Z2 Run, Long Run, Mobility, Rest |
| Units | kg, km, cm, g/katori — grep for `lb`, `lbs`, `mi`, `mile` returns nothing in UI |
| Protein/kcal targets | Read from `profiles.targets`; no literal `130` in components |
| HRV | No HRV labels or fields in production routes |
| Breakpoints | `md` = 768px, `xl` = 1200px in Tailwind config |
| Mobile nav | Tab bar visible only &lt;768px; sidebar ≥768px |
| Touch | Interactive controls ≥44px height on mobile tab bar / primary CTAs |
