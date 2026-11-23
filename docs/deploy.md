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

Users can still override hosts in **Settings → Share**. Self-host: point the SPA at your worker; see [`api.md`](./api.md) `/compatibility` (`protocol: 3`, `ttl`, `limits`).

### Operator caps (self-host)

Edit [`apps/worker/src/lib/config.ts`](../apps/worker/src/lib/config.ts) (TTL bounds, max file bytes, `ROTATE_MANAGE_MAX_IDS`, fair-use defaults), then redeploy the Worker. The SPA adapts via `GET /compatibility` — do not hardcode those numbers in clients. Optional env overrides: `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`.

Manage tokens live in the browser (Settings → Manage token / `#token`), not in Worker env.

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
