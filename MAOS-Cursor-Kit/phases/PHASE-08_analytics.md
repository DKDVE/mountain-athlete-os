# PHASE 08 — Analytics widgets + metric selectors
Read the Analytics spec and CONTRACTS §D. This populates the registry with the real cockpit.

## Goal
Every `DATA_SOURCES` id has a tested selector and at least one widget that visualizes it; the default dashboard becomes the full analytics cockpit; each chart shows one insight + one action line.

## Deliverables
1. **Selectors** in `features/metrics/selectors`: one typed selector per `DATA_SOURCES` id, built on the Phase-06 engine + raw logs, honoring the range option (4W/12W/6M/All). Fully unit-tested incl. empty/sparse data.
2. **Widgets** (each a registry entry, each with loading/empty/error, data-table toggle for a11y, export-as-image): Hybrid Score segmented ring, Trek Readiness gauge + checklist, est-1RM multi-line with PR flags + deload shading, Z2 pace-efficiency line, weekly-load stacked bars + ACR line with danger zone, readiness-vs-sleep combo, sleep consistency bands, protein bars vs target line, kcal 7-day avg band, weight dots + 7-day-avg + goal projection, waist trend with meso boundaries, body-fat uncertainty band, consistency heatmap.
3. Every chart: colors paired with labels/patterns (color never sole signal), tooltips focusable, `prefers-reduced-motion` respected (charts draw once, static under reduce-motion), one auto-generated insight line at the bottom.
4. Default dashboard config updated to present the cockpit in the spec's order; still fully user-editable via Phase 07.

## Gate
Universal Gate green. Each selector has passing unit tests incl. sparse data (no NaN, correct empty states). Every widget renders from seeded+logged data and toggles to a data table. Lighthouse Performance on the analytics route ≥ 90 (charts lazy-loaded).
