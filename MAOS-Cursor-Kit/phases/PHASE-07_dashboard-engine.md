# PHASE 07 — Config-driven dashboard (the AI-editable UI foundation)
Read CONTRACTS §D carefully. This phase builds the mechanism that lets both the user and (later) the AI reshape the UI safely.

## Goal
The home dashboard is rendered entirely from a validated `DashboardConfig` JSON. Users can add/remove/resize/reorder widgets manually; the config persists per-user. No widget is hardcoded into the page; the page is a renderer over the registry.

## Deliverables
1. **Widget registry:** a typed map from every `WIDGET_TYPES` entry to a React component with a uniform prop contract `{ instance: WidgetInstance, data }`. Each widget handles its own loading/empty/error state internally.
2. **Grid renderer:** reads `DashboardConfig.widgets`, lays them out on a responsive 12-col grid (reflows to 1-col mobile) using the `grid` field; virtualizes/lazy-loads chart widgets.
3. **Data binding:** a `useWidgetData(dataSource, options)` hook that maps each `DATA_SOURCES` id to a typed selector from Phase-06/08 metrics; returns strongly-typed series. Unknown source → typed error state, never crash.
4. **Manual editor mode:** toggle into edit → drag to reorder/resize, add widget (picker listing registry types × valid data sources), remove, edit widget options (range, series, goal line). Saving writes a Zod-validated `DashboardConfig` to `dashboards.config`. Invalid configs are rejected with a clear message and never persisted.
5. **Persistence + defaults:** on first login, seed a sensible default dashboard config. Multiple named dashboards optional but the schema supports it. Reset-to-default action.
6. Config migration guard: `version` field respected; a loader that can upgrade older configs.

## Guardrails
The dashboard page must contain **zero** hardcoded widgets — if you can't add/remove a thing from config, it doesn't belong on this page. This is what makes Phase 09's AI edit safe: AI only ever emits a `DashboardConfig`.

## Gate
Universal Gate green. Adding, resizing, removing, and reordering widgets persists across reload. Feeding a deliberately invalid config (bad type/source) is rejected by validation with a visible error and no crash (unit + component tested).
