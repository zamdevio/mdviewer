# Systems

| Doc | Surface |
|-----|---------|
| [`web.md`](web.md) | SPA |
| [`worker.md`](worker.md) | Share API |
| [`pwa-cache.md`](pwa-cache.md) | SW / Cache Storage migration |

Deploy secrets/vars: [`../../docs/deploy.md`](../../docs/deploy.md).

## Target stack

| Surface | Stack | Deploy |
|---------|-------|--------|
| `apps/web` | Vite + React + react-router + Tailwind | Cloudflare Pages (`markview`) |
| `apps/worker` | Hono + `@hono/zod-openapi` + Swagger UI | Cloudflare Workers (`mdviewer-api`) |
| Storage | R2 bucket `mdviewer` | Worker binding |
| Rate limit | Durable Object `RateLimiter` | Worker binding |

Env (web): `VITE_API_URL`, `VITE_FRONTEND_URL`  
Env (worker): `ALLOWED_ORIGINS`, optional rate-limit vars — [`../apps/worker/wrangler.jsonc`](../../apps/worker/wrangler.jsonc)

API docs: `GET /docs` (Swagger UI), `GET /openapi.json`
