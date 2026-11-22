# Rules

1. **Monorepo only** — `apps/web` + `apps/worker` + `maintainer/` + `docs/`.
2. **Vite, not Next** — no `next` dependency, no App Router pages.
3. **Worker is Hono + OpenAPI** — keep `/docs` (Swagger UI) and `/openapi.json` working.
4. **Features land via `maintainer/phases`** — update `focus.md` before large slices.
5. **No secrets in git** — `.env*` ignored; use `.env.example` for names only.
