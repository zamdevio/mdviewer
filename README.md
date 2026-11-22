# MDViewer

Premium markdown viewer + edge share API.

| App | Path | Stack |
|-----|------|-------|
| Web | [`apps/web`](apps/web) | Vite + React + Tailwind (Cloudflare Pages) |
| Worker | [`apps/worker`](apps/worker) | Hono + OpenAPI/Swagger (Cloudflare Workers + R2) |

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm web:dev      # http://localhost:3000
pnpm worker:dev   # wrangler; Swagger at /docs
```

More: [`docs/getting-started.md`](docs/getting-started.md) · [`docs/api.md`](docs/api.md) · [`docs/deploy.md`](docs/deploy.md)

Internal planning: [`maintainer/`](maintainer/)

## License

MIT — [zamdevio](https://github.com/zamdevio)
