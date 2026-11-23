<div align="center">
  <img src="https://markview.pages.dev/favicon.svg" width="72" height="72" alt="MDViewer logo" />

  <h1>MDViewer</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
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
| **llms.txt** | [mdviewer.zamdev.dev/llms.txt](https://mdviewer.zamdev.dev/llms.txt) | Agent/SEO brief ([full](https://mdviewer.zamdev.dev/llms-full.txt) · [API copy](https://api.mdviewer.zamdev.dev/llms-full.txt)) |
| **MCP** | [api.mdviewer.zamdev.dev/mcp](https://api.mdviewer.zamdev.dev/mcp) | JSON-RPC tools on the share Worker |
| **GitHub** | [github.com/zamdevio/mdviewer](https://github.com/zamdevio/mdviewer) | Source and issues |

## Why MDViewer

### Local-first writing
- Files stay in the browser — no account required for core use
- Auto-save, status bar, keyboard shortcuts, PWA install shell
- Updates apply on a normal reload (Ctrl+R) — no hard refresh required

### Projects & tree layout
- **Grid** or **tree/explorer** on Files — switch anytime
- Virtual **projects** (folders), drag-and-drop, right-click / ⋮ menus
- Searchable move-to-project picker; inline file and project rename
- Import/export merges projects by name; identical content fingerprints skip duplicates
- **Project share pack** (`MDVIEWER_PROJECT_V1`) — share a whole folder over the same upload API

### Bring your own share API
- Point the SPA at **your** worker from **Settings → Share** (`#share`)
- Public Vite defaults in repo (not secrets) + browser override with **Default** reset
- Header badge explains every state (connected, offline, API down, CORS, share off) via dialog

### Compatibility handshake
- Worker `GET /compatibility` — versioned contract for custom frontends/backends
- **Test connection** in Settings hits `/health` + `/compatibility`

### Rich preview
- GFM, Mermaid, KaTeX, syntax highlighting, image lightbox

### Edge share
- Workers + R2, CORS allowlist, fair-use (IP+UA), fixed TTL, **manage token** (mutate) + optional disposable **view password** (GET), OpenAPI `/docs`
- Protocol **3** — Settings → Manage token (`#token`); SPA reads `/compatibility` for TTL/`limits`
- **Agents and humans share the same manage/view rules** — MCP (`POST /mcp`) is not a privileged path
- SPA + Worker ship [`/llms.txt`](https://mdviewer.zamdev.dev/llms.txt) / [`/llms-full.txt`](https://api.mdviewer.zamdev.dev/llms-full.txt); MCP tools take `manageToken` for mutate
- Roadmap until **v4.0**: [`maintainer/final.md`](./maintainer/final.md) · Focus [`04-perf-large-docs`](./maintainer/phases/04-perf-large-docs.md)

### Security
- Local-first by default; preview sanitizes HTML; Mermaid runs in `strict` mode
- Pages security headers (CSP, frame deny, COOP); share API override accepts http(s) only
- Report vulns: [`SECURITY.md`](./SECURITY.md) · threat model: [`docs/security.md`](./docs/security.md)

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
| [`docs/security.md`](./docs/security.md) | Threat model + mitigations |
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

Env names: see [`.env.example`](./.env.example). Worker CORS / share origins: `ALLOWED_ORIGINS` in [`apps/worker/wrangler.jsonc`](./apps/worker/wrangler.jsonc) (include `http://localhost:3000` for local share).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Maintainer Focus / pre–v4.0 checklist: [`maintainer/phases/focus.md`](./maintainer/phases/focus.md), [`maintainer/final.md`](./maintainer/final.md).

## License

MIT — see [`LICENSE`](./LICENSE). [zamdevio](https://github.com/zamdevio)
