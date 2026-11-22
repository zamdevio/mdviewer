<div align="center">
  <img src="https://markview.pages.dev/favicon.svg" width="72" height="72" alt="MDViewer logo" />

  <h1>MDViewer</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
  [![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
  [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://markview.pages.dev)

  <p><strong>Edit · organize · preview · share · offline</strong></p>
  <p>
    Offline-first Markdown studio — live preview, local projects, and optional edge share links.
    Private by default. Share when you want.
  </p>
  <p>
    <a href="https://mdviewer.zamdev.dev">App</a> ·
    <a href="https://markview.pages.dev">Pages</a> ·
    <a href="./docs/getting-started.md">Docs</a> ·
    <a href="#quick-start">Quick start</a>
  </p>
</div>

---

Client-side Markdown studio with an optional Cloudflare Workers share API. The SPA lives in `apps/web` (Vite + React); uploads and downloads run on `apps/worker` (Hono + OpenAPI, R2, Durable Object rate limits).

| Surface | URL | Role |
|---------|-----|------|
| **App** | [mdviewer.zamdev.dev](https://mdviewer.zamdev.dev) | Production SPA |
| **Pages** | [markview.pages.dev](https://markview.pages.dev) | Cloudflare Pages deploy |
| **Worker API** | [api.mdviewer.zamdev.dev](https://api.mdviewer.zamdev.dev) | Upload / share / health / compatibility |
| **API docs** | [api.mdviewer.zamdev.dev/docs](https://api.mdviewer.zamdev.dev/docs) | Swagger UI (OpenAPI) |
| **GitHub** | [github.com/zamdevio/mdviewer](https://github.com/zamdevio/mdviewer) | Source and issues |

## Why MDViewer

### ✨ Local-first writing
- Files stay in the browser — no account required for core use
- Auto-save, status bar, keyboard shortcuts, PWA install shell

### 🗂️ Projects & layouts
- **Grid** or **tree/explorer** on Files — switch anytime
- Group notes into virtual **projects** (folders) without renaming files
- Import/export backups include projects

### 🔗 Bring your own share API
- Point the SPA at **your** worker from **Settings → Share** (`#share`)
- Build-time defaults + browser override with **Default** reset (confirm)
- Header badge explains every state (connected, offline, API down, CORS, share off) via dialog — not hover-only

### 🤝 Compatibility handshake
- Worker `GET /compatibility` — versioned contract for custom frontends/backends
- **Test connection** in Settings hits `/health` + `/compatibility`

### 🎨 Rich preview
- GFM, Mermaid, KaTeX, syntax highlighting, image lightbox

### ⚡ Edge share
- Workers + R2, CORS allowlist, upload rate limiting, OpenAPI `/docs`

## Quick start

Requires **Node.js >= 20** and **pnpm**.

```bash
pnpm install
cp .env.example .env.local
# set VITE_API_URL and VITE_FRONTEND_URL (optional if you configure Settings → Share later)

pnpm web:dev       # http://localhost:3000
pnpm worker:dev    # wrangler; Swagger at /docs
```

```bash
pnpm web:build
pnpm typecheck
```

> **Tip:** After deploy, set GitHub Actions Variables `VITE_API_URL` / `VITE_FRONTEND_URL` for production builds. Users can still override in-app under Settings → Share.

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
| [`docs/getting-started.md`](./docs/getting-started.md) | Install, local run, Settings → Share |
| [`docs/architecture.md`](./docs/architecture.md) | High-level layout |
| [`docs/api.md`](./docs/api.md) | Worker endpoints + compatibility |
| [`docs/deploy.md`](./docs/deploy.md) | Pages + Worker + CI |
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

Env names: see [`.env.example`](./.env.example). Worker CORS / share origins: `ALLOWED_ORIGINS` in [`apps/worker/wrangler.toml`](./apps/worker/wrangler.toml) (include `http://localhost:3000` for local share).

## License

MIT — [zamdevio](https://github.com/zamdevio)
