# Rules

1. **Monorepo only** — `apps/web` + `apps/worker` + `maintainer/` + `docs/`.
2. **Vite, not Next** — no `next` dependency, no App Router pages.
3. **Worker is Hono + OpenAPI** — keep `/docs` (Swagger UI) and `/openapi.json` working.
4. **Features land via `maintainer/phases`** — update `focus.md` before large slices.
5. **No secrets in git** — `.env*` ignored; use `.env.example` for names only.
6. **PWA cache migrations stay safe** — follow [`../systems/pwa-cache.md`](../systems/pwa-cache.md); never rename cache prefixes without dual-clean activate logic.
7. **Cloudflare is production** — Pages + Worker via Actions; do not revive Fly as the app host.
