# Appflare catalog readiness

**Focus label:** **Now** ([`focus.md`](./focus.md))  
**Goal:** Unified SPA+API Worker for Appflare (self-host from repo first; catalog later).  
**Status:** **Local pack** — root `wrangler.jsonc` + `scripts/appflare/` gateway  
**Agent submit guide:** https://appflare.dev/agent/submit.md

## Shape (current)

- **One Worker:** SPA at `/`, share API at `/api/*` (gateway rewrites; **no `apps/*` edits**).
- **Root** [`wrangler.jsonc`](../../wrangler.jsonc) — what Appflare “From a repository” detects.
- **`scripts/appflare/`** — `entry.ts`, `build.mjs`, README. Prod Pages + `apps/worker/wrangler.jsonc` untouched.
- **Build:** `pnpm appflare:build` then `pnpm appflare:dev` / Appflare UI command `pnpm run appflare:build`.
- **Post-install:** `ALLOWED_ORIGINS` = app origin; SPA Settings → Frontend = origin, API = `…/api`.

## Slices

| Slice | Scope | Status |
|-------|--------|--------|
| **1** | Unified root wrangler + gateway + `appflare:build` | Done |
| **2** | Local smoke: `/` + `/api/health` | Done (dev) |
| **3** | Import on self-hosted Appflare (from repo) | Next |
| **4** | Catalog PR / maintainer ask (stars soft bar) | Later — prior [#536](https://github.com/appflare/catalog/pull/536) closed on stars |
| **5** | Optional Install badge after a path is green | Later |

## Stars

Soft bar; repo may sit under the public threshold. Prefer self-host validation before another catalog PR.

## Checklist

- [x] Root `wrangler.jsonc` + gateway (SPA + `/api`)
- [x] Local `appflare:build` + dry-run / `appflare:dev` smoke (`/`, `/api/health`, SPA `/share/*`, API 404 under `/api`)
- [ ] Self-hosted Appflare from-repo install
- [ ] Decide catalog vs ask maintainers (no rush)
