# Deploy

## Web (Cloudflare Pages)

```bash
pnpm web:deploy
```

Set Pages env: `VITE_API_URL`, `VITE_FRONTEND_URL` (or `API_URL` / `FRONTEND_URL` — both accepted by `vite.config.ts`).

SPA fallback: `apps/web/public/_redirects` → `/* /index.html 200`.

## Worker

```bash
pnpm worker:deploy
```

Configure `ALLOWED_ORIGINS` in [`apps/worker/wrangler.toml`](../apps/worker/wrangler.toml). Ensure R2 bucket + Durable Object migration exist.
