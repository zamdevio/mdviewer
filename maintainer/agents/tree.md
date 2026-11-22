# Tree

```text
apps/
  web/          Vite + React SPA (Cloudflare Pages)
  worker/       Hono OpenAPI Worker (R2 + Durable Objects)
docs/           Public / helpful documentation
maintainer/     Internal planning (not product UI)
  agents/
  phases/
  shipped/
  systems/
  temp/         gitignored scratch
```

Do not resurrect a root-level Next.js app. Frontend lives only under `apps/web`.
