# Deploy with Appflare

MDViewer ships a **unified Worker** pack for [Appflare](https://appflare.dev/): SPA at `/`, share API at `/api/*`, one `*.workers.dev` hostname — no separate Pages project and no API subdomain required.

Production hosted at [mdviewer.zamdev.dev](https://mdviewer.zamdev.dev) still uses the split path (Pages + `apps/worker`). Appflare uses the root [`wrangler.jsonc`](../wrangler.jsonc) + [`scripts/appflare/`](../scripts/appflare/).

Example install: [appflaremdviewer.zamdevio.workers.dev](https://appflaremdviewer.zamdevio.workers.dev/).

## What you get

| Path | Serves |
|------|--------|
| `/` | Vite SPA (same build as `apps/web`) |
| `/api/*` | Share Worker (health, upload, share, MCP, OpenAPI) |
| Cron | Daily TTL sweep of expired shares (needs **Workers Paid**) |

Build injects `VITE_API_URL=/api` and `VITE_FRONTEND_URL=same-origin`, so Share works on the Worker origin without manual SPA URL overrides.

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
6. **Allowed origins** — leave as `{{appUrl}}` (Appflare expands it). The Worker also **always allows its own origin**, so unified SPA+`/api` installs work even if an old localhost value is still in settings. Only add extra origins if you open the UI from another host (split SPA).

Deep link:

```text
https://<your-appflare>/install/github/zamdevio/mdviewer
```

### Settings that should *not* appear

Root `.env.example` no longer lists `VITE_*` (those wrongly showed up as Worker secrets). SPA env for Pages lives in [`apps/web/.env.example`](../apps/web/.env.example).

If an older install still shows **Vite api url** / **Vite frontend url** secrets: clear them in Appflare → app Settings (or leave unset). They are unused by the unified pack.

### Logo / icon

The Worker serves the MDViewer favicon from SPA assets (`/favicon.svg`, `/favicon.png`) — browser tab and bookmarks use that. Appflare’s **from-repo** app list uses a monogram today; a catalog entry can ship a proper icon later. No extra Appflare-only logo file is required for the product itself.

## After install

- Open the Worker URL — Share already targets `/api` on the same origin (build injects `/api` + `same-origin`; no Vite secrets needed).
- Same-origin CORS is automatic; prefer `ALLOWED_ORIGINS={{appUrl}}` so share *links* use this host (stale localhost is ignored for CORS to self).
- First visit: a one-time dialog asks whether to show example editor content (default **On**). Change later under Settings → Editor.

## Local smoke (same pack)

```bash
pnpm appflare:build
pnpm appflare:dev
# SPA  http://127.0.0.1:8787/
# API  http://127.0.0.1:8787/api/health
```

`appflare:build` strips Pages-only `dist/_redirects` so Workers Assets SPA fallback does not loop. Dev overrides CORS with `--var ALLOWED_ORIGINS:…` because `{{appUrl}}` is Appflare-only.

## Catalog status

Not listed in the public Appflare catalog yet (star soft-bar). **From a repository** works without a catalog entry.

## Related

- [`deploy.md`](deploy.md) — split Pages + Worker production deploy
- [`security.md`](security.md) — threat model
- [`scripts/appflare/README.md`](../scripts/appflare/README.md) — packaging notes
- [`images/`](images/) — screenshot drop zone for README
