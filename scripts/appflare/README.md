# Appflare packaging

Dedicated Worker config for [Appflare](https://appflare.dev/) catalog installs. Leaves `apps/worker/wrangler.jsonc` and Pages deploys alone.

| Path | Role |
|------|------|
| `wrangler.jsonc` | Worker-only share API: R2 + RateLimiter DO + daily TTL cron. No custom routes. Neutral default `ALLOWED_ORIGINS` (installer overrides). |

Catalog entry (`appflare/catalog` → `apps/mdviewer/appflare.jsonc`) should set:

- `install.wranglerConfig`: `scripts/appflare/wrangler.jsonc`
- `install.packageManager`: `pnpm`
- `install.installDirs`: `[{ "path": "." }]` (workspace root installs `apps/worker`)
- `install.buildCommand`: `pnpm --filter @mdviewer/worker run generate:llms`
- `install.health`: `{ "path": "/health" }`
- `plan`: `"paid"` (cron), `requires`: `["r2"]`
- `vars`: required `ALLOWED_ORIGINS` (comma-separated SPA origins)

Full product (SPA assets + API) is out of scope until this Worker-only pack is green.
