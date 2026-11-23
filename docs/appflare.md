# Deploy with Appflare

MDViewer ships a **unified Worker** pack for [Appflare](https://appflare.dev/): SPA at `/`, share API at `/api/*`, one `*.workers.dev` hostname — no separate Pages project and no API subdomain required.

Production hosted at [mdviewer.zamdev.dev](https://mdviewer.zamdev.dev) still uses the split path (Pages + `apps/worker`). Appflare uses the root [`wrangler.jsonc`](../wrangler.jsonc) + [`scripts/appflare/`](../scripts/appflare/).

## What you get

| Path | Serves |
|------|--------|
| `/` | Vite SPA (same build as `apps/web`) |
| `/api/*` | Share Worker (health, upload, share, MCP, OpenAPI) |
| Cron | Daily TTL sweep of expired shares (needs **Workers Paid**) |

Build injects `VITE_API_URL=/api` and `VITE_FRONTEND_URL=same-origin`, so Share settings work on the Worker origin without manual URL overrides.

## Requirements

- An [Appflare](https://appflare.dev/) manager on your Cloudflare account
- **Workers Paid** + **sandbox builds** (Settings → Building apps → Build in your account)
- R2 (Appflare creates the bucket from the wrangler binding)

## Install from this repository

1. In Appflare → Catalog → **From a repository**.
2. Repository: `zamdevio/mdviewer` (or `https://github.com/zamdevio/mdviewer`).
3. Branch/tag/commit: default `main` (or pin a commit).
4. Build command: **Run this command** → `pnpm run appflare:build`  
   Do **not** use “Work it out” (root `pnpm build` is the whole monorepo).
5. **Build for review**, then install.
6. Set **ALLOWED_ORIGINS** to the app origin (e.g. `https://mdviewer.<account>.workers.dev`).

Deep link (opens “from repository” on *your* Appflare host):

```text
https://<your-appflare>/install/github/zamdevio/mdviewer
```

If you use [Use this Appflare on appflare.dev](https://appflare.dev/guides/install-links/), Install buttons on appflare.dev can route to that manager.

### After install

- Open the Worker URL — Share should already target `/api` on the same origin.
- CORS: `ALLOWED_ORIGINS` must include that origin (same value as the address bar).
- Optional: Settings → Share still accepts absolute URLs or `/api` + `same-origin`.

## Local smoke (same pack)

```bash
pnpm appflare:build
pnpm appflare:dev
# SPA  http://127.0.0.1:8787/
# API  http://127.0.0.1:8787/api/health
```

`appflare:build` strips Pages-only `dist/_redirects` so Workers Assets SPA fallback does not loop.

## Catalog status

Not listed in the public Appflare catalog yet (star soft-bar). **From a repository** works without a catalog entry. A catalog PR can come later once packaging stays green on your self-hosted Appflare.

## Related

- [`deploy.md`](deploy.md) — split Pages + Worker production deploy
- [`security.md`](security.md) — threat model
- [`scripts/appflare/README.md`](../scripts/appflare/README.md) — packaging notes
