# Worker (`apps/worker`)

- Framework: Hono `OpenAPIHono`
- Routes: `POST /upload`, `GET /share/:id`, `GET /health`
- Docs: `GET /docs`, `GET /openapi.json`
- CORS from `ALLOWED_ORIGINS`
- Rate limit Durable Object: `src/rate-limiter.ts`
- Content stored in R2 (`R2_BUCKET`)
