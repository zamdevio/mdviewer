# Deploy

**GitHub Actions → Cloudflare** on every `main` push ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)):

1. Pages project `markview` (`apps/web` → Vite dist)
2. Worker `mdviewer-api` (`apps/worker`)

## GitHub setup

**Secrets**

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Pages Edit + Workers Scripts Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |

**Variables** (optional; public defaults already baked in Vite)

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://api.mdviewer.zamdev.dev` |
| `VITE_FRONTEND_URL` | `https://mdviewer.zamdev.dev` |

Users can still override hosts in **Settings → Share**. Self-host: point the SPA at your worker; see [`api.md`](./api.md) `/compatibility`.

## Manual

```bash
pnpm web:deploy
pnpm worker:deploy
```

Configure `ALLOWED_ORIGINS` in [`apps/worker/wrangler.jsonc`](../apps/worker/wrangler.jsonc) (include `http://localhost:3000` for local share). R2 + Durable Object bindings required.

## SPA routing (Pages)

| Piece | Role |
|-------|------|
| Build: `settings.html`, `editor.html`, … | Pretty URLs **without** trailing slash (`/settings` not `/settings/`) |
| `_redirects` | Strip `/settings/` → `/settings` (301); catch-all `/* → /index.html 200` for `/share/:id` etc. |
| `_headers` | HTML shells `CDN-Cache-Control: no-store` so custom domains don’t keep stale shells |

## PWA

SW rules: [`maintainer/systems/pwa-cache.md`](../maintainer/systems/pwa-cache.md).
