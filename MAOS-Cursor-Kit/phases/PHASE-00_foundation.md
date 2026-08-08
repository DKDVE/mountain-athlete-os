# PHASE 00 — Foundation, CI, and a LIVE deploy skeleton
Read `/docs/CONTRACTS.md` and the Project Rules first. Do not build features in this phase.

## Goal
A pnpm monorepo that builds, tests, lints, and is already deployed: `apps/web` on GitHub Pages, `apps/api` on Render with a working `/health`. Integration risk is paid down before any feature exists.

## Deliverables (all real, none stubbed beyond the intentional skeleton)
1. pnpm workspace: `apps/web`, `apps/api`, `packages/shared`. Root scripts: `typecheck`, `lint`, `test`, `build` fan out to all packages.
2. `apps/web`: Vite + React + TS strict, Tailwind configured with the monochrome tokens from CONTRACTS §A/design, shadcn/ui initialized, vite-plugin-pwa set up (installable, offline shell), router with `VITE_APP_BASE_PATH` and a `public/404.html` SPA fallback for Pages. A single "MAOS — online" landing route reading `VITE_API_BASE_URL/health` and showing status.
3. `apps/api`: Fastify + TS, `/health` route, CORS locked to `ALLOWED_ORIGIN`, JWT-verify middleware written (not yet used elsewhere), Dockerfile or Render build config.
4. `packages/shared`: Zod + `zod-to-json-schema` deps, ULID util, one exported schema (`SetLog`) to prove the import path both apps consume.
5. Tooling: ESLint (strict, no warnings), Prettier, Vitest configured in web + shared, Playwright scaffolded (one smoke test hitting the landing route), Husky pre-commit running typecheck+lint+test on staged.
6. **CI (GitHub Actions):** on PR → install, typecheck, lint, test, build. On merge to main → build web and deploy to Pages; trigger Render deploy for api.
7. `/docs/VERSIONS.md` (pinned versions), `.env.example` (every var from CONTRACTS §A), `README.md` (run + deploy steps).

## Guardrails
Use the MCP servers you have (GitHub, Render, Supabase, Stitch) to create the repo, Render service, and Supabase project, and to store env vars — do not hardcode secrets. Pin latest stable versions and record them. No feature code, no mock business data.

## Gate
Universal Gate green. The Pages URL loads the landing route with no console errors and shows API health = ok. A PR shows CI green. Paste both URLs and the CI run link.
