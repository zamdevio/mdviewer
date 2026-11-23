# Appflare / unified Worker

One Worker: SPA at `/`, share API at `/api/*`. No changes under `apps/*` — gateway only.

| Path | Role |
|------|------|
| [`../../wrangler.jsonc`](../../wrangler.jsonc) | Root config Appflare “From a repository” detects |
| `entry.ts` | `/api/*` → Worker routes; else Vite assets |
| `build.mjs` | `pnpm appflare:build` — llms generate + web build |

Production stays split: Pages (`apps/web`) + `apps/worker/wrangler.jsonc`.

## Local

```bash
pnpm appflare:build   # injects VITE_API_URL=/api + VITE_FRONTEND_URL=same-origin
pnpm appflare:dev
# SPA:  http://127.0.0.1:8787/
# API:  http://127.0.0.1:8787/api/health
```

Share settings are baked for same-origin (`/api`). Set Worker **ALLOWED_ORIGINS** to the page origin (dev defaults cover `8787`).

## Appflare (self-host, from repo)

1. Building apps → sandbox on (Workers Paid).
2. Catalog → **From a repository** → `zamdevio/mdviewer`.
3. Build command: **Run this command** → `pnpm run appflare:build` (not “Work it out”).
4. Install; set **ALLOWED_ORIGINS** to the app origin (`https://…workers.dev`).
5. Open the app — Share should already use `/api` + same-origin (no Settings required).
