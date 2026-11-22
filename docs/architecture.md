# Architecture

```text
Browser (apps/web)
  └── Vite React SPA + PWA
        ├── localStorage (files, projects, settings, API override)
        ├── Connection badge → ModalShell status dialogs
        └── HTTP share client (effective API URL)
              └── Cloudflare Worker (apps/worker)
                    ├── Hono + OpenAPI
                    ├── /health · /compatibility · /upload · /share/:id
                    ├── R2 (content)
                    └── Durable Object rate limiter (uploads)
```

No Next.js. No server-rendered pages. Worker is the only backend.

## Effective share config

1. Build-time: `VITE_API_URL` / `VITE_FRONTEND_URL`
2. Optional browser override: `localStorage` key `mdviewer_api_override` (Settings → Share)
3. Share/health/upload always use **effective** URLs (`getEffectiveApiConfig()`)

## Files organization

- Flat `SavedFile` records with optional `projectId`
- `mdviewer_projects` list for virtual folders
- UI: grid cards or tree explorer (`filesLayout` setting) — DnD, context menus, project share packs
- Project packs: text payload `MDVIEWER_PROJECT_V1` + JSON over `POST /upload` (no multipart)

## PWA updates

Service worker uses network-first for HTML and hashed `/assets/*` so a normal reload picks up new deploys. See [`maintainer/systems/pwa-cache.md`](../maintainer/systems/pwa-cache.md).
