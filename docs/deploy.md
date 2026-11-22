# Deploy

Primary path: **GitHub Actions → Cloudflare** on every `main` push (see [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml)).

The old **Fly.io** GitHub “production” deployment is legacy (Next-era). New production traffic is Cloudflare Pages (`markview`) + Worker (`mdviewer-api`). Mark Fly inactive in GitHub Deployments if it still shows as Active.

## One-time GitHub setup

Repository **Secrets**:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Token with Pages Edit + Workers Scripts Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |

Repository **Variables** (you add these yourself — build-time for the SPA):

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://api.mdviewer.zamdev.dev` |
| `VITE_FRONTEND_URL` | `https://mdviewer.zamdev.dev` |

Without those Variables, Pages still deploys, but the built SPA has empty API/frontend URLs (share stays off until the user sets **Settings → Share**).

### Self-host share worker

Users can point any deployed SPA at a custom worker via Settings → Share. Document `/compatibility` for integrators — see [`api.md`](./api.md).

## Manual deploy

```bash
pnpm web:deploy
pnpm worker:deploy
```

SPA fallback: `apps/web/public/_redirects` → `/* /index.html 200`.

Configure `ALLOWED_ORIGINS` in [`apps/worker/wrangler.toml`](../apps/worker/wrangler.toml) (include `http://localhost:3000` for local share). Ensure R2 bucket + Durable Object migration exist.

## PWA / cache

Service worker cache migration rules: [`maintainer/systems/pwa-cache.md`](../maintainer/systems/pwa-cache.md).
