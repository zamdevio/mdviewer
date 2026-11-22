# Getting started

## Requirements

- Node 20+
- pnpm (repo pins `packageManager` in root `package.json`)

## Install

```bash
pnpm install
```

Copy env:

```bash
cp .env.example .env.local
```

Set `VITE_API_URL` and `VITE_FRONTEND_URL` for build-time defaults.

## Dev

```bash
# SPA (http://localhost:3000)
pnpm web:dev

# Worker API (wrangler)
pnpm worker:dev
```

- Swagger UI (worker): `/docs`
- OpenAPI JSON: `/openapi.json`
- Compatibility handshake: `/compatibility`

## Share API in the browser

You can override the share worker **without rebuilding**:

1. Open **Settings → Share** (or `/settings#share`)
2. Set **Worker API URL** and **Frontend URL**
3. **Save**, then **Test connection** (`/health` + `/compatibility`)
4. **Default** restores build-time env after a confirmation dialog

Build-time `VITE_*` values remain the fallback when no override is stored.

## Files: grid vs tree

On **Files**, toggle **Grid** / **Tree**. Tree mode uses virtual **projects** to group files. Preference is saved in settings (`filesLayout`).

## Local CORS

For share from `http://localhost:3000`, ensure that origin is listed in `ALLOWED_ORIGINS` in [`apps/worker/wrangler.toml`](../apps/worker/wrangler.toml) and redeploy the worker.
