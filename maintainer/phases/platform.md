# Platform

Target shape after reshape:

| Surface | Stack | Deploy |
|---------|-------|--------|
| `apps/web` | Vite + React + react-router + Tailwind | Cloudflare Pages (`markview`) |
| `apps/worker` | Hono + `@hono/zod-openapi` + Swagger UI | Cloudflare Workers (`mdviewer-api`) |
| Storage | R2 bucket `mdviewer` | Worker binding |
| Rate limit | Durable Object `RateLimiter` | Worker binding |

Env (web): `VITE_API_URL`, `VITE_FRONTEND_URL`  
Env (worker): `ALLOWED_ORIGINS`, optional rate-limit vars

API docs: `GET /docs` (Swagger UI), `GET /openapi.json`
