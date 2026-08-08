# PHASE 09 — AI Coach (proxy + OpenRouter + apply engine + routine import + AI dashboard edit)
Read CONTRACTS §E. The AI is a convenience layer over the same tables and configs; it can never emit code and never bypass validation.

## Goal
A conversational coach that adapts today's plan, imports a routine from free text, and edits the dashboard — all via schema-validated structured output, all reversible, all degrading gracefully on the free tier.

## Deliverables — Render proxy (`apps/api`)
1. Implement `/coach/chat`, `/coach/import-routine`, `/dashboard/ai-edit` per CONTRACTS §E: verify Supabase JWT → assemble/receive context → call OpenRouter (`OPENROUTER_MODEL=openrouter/free`) with `response_format: json_schema` for the exact schema of that route → **re-validate the model output with the shared Zod schema** → return `{ok,data}` or `{ok:false,error:{code:'AI_SCHEMA',retryable:true}}`. Handle free-tier failures (rate limit, model rotation, timeout) as typed retryable errors. Cold-start tolerated because no logging depends on this.
2. Rule-based **fallback engine** (pure, in `packages/shared`) for the deterministic adaptations (low-sleep ease, 45-min compress, pain swap, exam mode, protein rescue) so core coaching works offline and when the LLM fails — the spec's canonical scenarios must work without the network.

## Deliverables — client
3. Coach surface per spec: context header (what the coach knows), chat thread, message bubbles with a **diff block** (old struck / new highlighted) and ≤3 action buttons.
4. **Apply engine:** applying a `CoachAction` mutates today's plan atomically, writes a `plan_events` row (revertable ≤24h), stamps Calendar + thread. Safety wrapper: pain outranks progression; nutrition never below floors; medical red-flags → decline + advise care, no adaptation.
5. **Routine import:** paste free text → proxy returns `ProgramDraft`/`MealDraft` + `DiffPreview` → user sees preview → apply writes the program/meals; manual path unchanged underneath.
6. **AI dashboard edit:** instruction + current `DashboardConfig` + available sources → proxy returns a new `DashboardConfig` (validated) + change summary → user sees preview diff → apply persists. Invalid/hallucinated source → rejected pre-apply.

## Gate
Universal Gate green. **E2E:** (a) "I slept 5 hours" produces an eased plan via the fallback engine with the LLM disabled; (b) with the proxy live, "add a waist-trend chart and remove calories" returns a valid DashboardConfig that renders after apply; (c) an intentionally malformed AI response is rejected and shows retry, never applied. JWT rejection tested (no token → 401). CORS restricted to the Pages origin (tested).
