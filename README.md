# Mountain Athlete OS

Production-grade PWA for hybrid-athlete tracking.

## Prerequisites

- Node.js 22+
- pnpm 10+

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env with your values
```

## Development

```bash
# API (port 3000)
pnpm --filter @maos/api dev

# Web (port 5173)
pnpm --filter @maos/web dev
```

## Quality gate

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Deploy

### Web — GitHub Pages

- Base path: `/mountain-athlete-os` (set via `VITE_APP_BASE_PATH`)
- CI deploys `apps/web/dist` to GitHub Pages on merge to `main`
- SPA fallback: `public/404.html` handles deep links

### API — Render

- Service root: `apps/api`
- Build: `pnpm install && pnpm --filter @maos/shared build && pnpm --filter @maos/api build`
- Start: `node apps/api/dist/index.js`
- Health check: `GET /health`

Set Render env vars from `.env.example` (secrets section). Set `ALLOWED_ORIGIN` to your GitHub Pages URL.

## Monorepo layout

```
apps/web      — Vite + React PWA (GitHub Pages)
apps/api      — Fastify API (Render)
packages/shared — Zod schemas + shared types
docs/CONTRACTS.md — frozen source of truth
```
