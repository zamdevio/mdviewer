# Architecture

```text
Browser (apps/web)
  └── Vite React SPA + PWA
        ├── localStorage file store
        └── HTTP share client
              └── Cloudflare Worker (apps/worker)
                    ├── Hono + OpenAPI
                    ├── R2 (content)
                    └── Durable Object rate limiter (uploads)
```

No Next.js. No server-rendered pages. Worker is the only backend.
