<div align="center">
  <img src="https://markview.pages.dev/favicon.svg" width="72" height="72" alt="MDViewer logo" />

  <h1>MDViewer</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
  [![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
  [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://markview.pages.dev)

  <p><strong>Edit · preview · share · offline</strong></p>
  <p>
    Premium markdown viewer for the modern web — GitHub-flavored preview, Mermaid/Math/code,
    local files, and edge-powered share links.
  </p>
  <p>
    <a href="https://mdviewer.zamdev.dev">App</a> ·
    <a href="https://markview.pages.dev">Pages</a> ·
    <a href="./docs/getting-started.md">Docs</a> ·
    <a href="#quick-start">Quick start</a>
  </p>
</div>

---

Client-side markdown studio with a Cloudflare Workers share API. The SPA lives in `apps/web` (Vite + React); uploads and downloads run on `apps/worker` (Hono + OpenAPI, R2, Durable Object rate limits).

| Surface | URL | Role |
|---------|-----|------|
| **App** | [mdviewer.zamdev.dev](https://mdviewer.zamdev.dev) | Production SPA |
| **Pages** | [markview.pages.dev](https://markview.pages.dev) | Cloudflare Pages deploy |
| **Worker API** | [api.mdviewer.zamdev.dev](https://api.mdviewer.zamdev.dev) | Upload / share / health |
| **API docs** | [api.mdviewer.zamdev.dev/docs](https://api.mdviewer.zamdev.dev/docs) | Swagger UI (OpenAPI) |
| **GitHub** | [github.com/zamdevio/mdviewer](https://github.com/zamdevio/mdviewer) | Source and issues |

## Why MDViewer

- **Fast local editing** — files stay in the browser; no account required for core use.
- **Rich preview** — GFM, Mermaid, KaTeX, syntax highlighting, image lightbox.
- **Share at the edge** — Workers + R2, CORS allowlist, upload rate limiting.
- **PWA-ready** — installable shell with versioned service worker cache.
- **OpenAPI worker** — `/docs` + `/openapi.json` for the share API.

## Quick start

Requires **Node.js >= 20** and **pnpm**.

```bash
pnpm install
cp .env.example .env.local
# set VITE_API_URL and VITE_FRONTEND_URL

pnpm web:dev       # http://localhost:3000
pnpm worker:dev    # wrangler; Swagger at /docs
```

```bash
pnpm web:build
pnpm typecheck
```

## Repository layout

```text
apps/
  web/          Vite + React SPA (Cloudflare Pages)
  worker/       Hono OpenAPI Worker (R2 + rate limiter)
docs/           Getting started, API, deploy
maintainer/     Internal phases, systems maps, agent guides
```

| Path | Stack |
|------|-------|
| [`apps/web`](./apps/web) | Vite, React Router, Tailwind |
| [`apps/worker`](./apps/worker) | Hono, `@hono/zod-openapi`, Wrangler |

## Documentation

| Doc | Topic |
|-----|-------|
| [`docs/getting-started.md`](./docs/getting-started.md) | Install and local run |
| [`docs/architecture.md`](./docs/architecture.md) | High-level layout |
| [`docs/api.md`](./docs/api.md) | Worker endpoints |
| [`docs/deploy.md`](./docs/deploy.md) | Pages + Worker deploy |
| [`maintainer/`](./maintainer/) | Focus, phases, systems (contributors) |

## Development

```bash
pnpm web:dev
pnpm worker:dev
pnpm web:build
pnpm worker:typecheck
pnpm web:deploy      # Pages → markview
pnpm worker:deploy   # Workers → mdviewer-api
```

Env names: see [`.env.example`](./.env.example). Worker CORS / share origins: `ALLOWED_ORIGINS` in [`apps/worker/wrangler.toml`](./apps/worker/wrangler.toml).

## License

MIT — [zamdevio](https://github.com/zamdevio)
