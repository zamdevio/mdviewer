# Appflare catalog readiness

**Focus label:** **Now** ([`focus.md`](./focus.md))  
**Order:** packaging + catalog **after** v4.0.0 ships  
**Goal:** Make MDViewer installable via [Appflare](https://appflare.dev/) and submit to [appflare/catalog](https://github.com/appflare/catalog) when packaging is green.  
**Status:** **Submitted** — packaging on `main` @ `963d35a`; catalog PR [#536](https://github.com/appflare/catalog/pull/536)  
**Agent submit guide:** https://appflare.dev/agent/submit.md

## Slices

| Slice | Scope | Status |
|-------|--------|--------|
| **1** | Scaffold `scripts/appflare/` + Appflare-only wrangler (leave prod configs alone) | Done |
| **2** | `pnpm validate` + `pnpm pack-app` against a catalog fork; health green | Done |
| **3** | Manifest (protocol 3 summary, `paid`, `r2`) → PR to `appflare/catalog` | [#536](https://github.com/appflare/catalog/pull/536) |
| **4** | Optional Install badge; later full-product SPA+API pack if wanted | After merge |

## How submission works

- Catalog entry lives in **appflare/catalog**, not here: `apps/<slug>/appflare.jsonc` + PR.
- Upstream keeps normal deploy paths; Appflare uses **dedicated** packaging under `scripts/appflare/` — never rewrite production `wrangler.jsonc` / Pages flow.
- CI on their side: validate → pack pinned commit → install/health check.

## Stars (not a hard wall)

Public docs still say ≥50★ and under-bar PRs may auto-close — but **live catalog apps often sit under 50**. Treat 50 as a **soft / negotiable** bar. This repo is at **0★** today: pack solid first, then submit and talk to maintainers if CI nags.

| Gate | Status | Notes |
|------|--------|-------|
| Public GitHub repo | ✅ | `zamdevio/mdviewer` |
| Stars | Soft (0) | Not a reason to stall packaging |
| Deploys with wrangler | ✅ | Dedicated `scripts/appflare/wrangler.jsonc` |
| Self-contained DO | ✅ | `RateLimiter` in worker |
| License | ✅ | MIT |
| Plan | **`paid`** | Cron TTL sweep |
| `requires` | `["r2"]` | Share storage |

## Packaging shape

### Dedicated Appflare surface (prod untouched)

- `apps/worker/wrangler.jsonc` + Pages = day-to-day path (custom routes / personal origins stay there).
- `scripts/appflare/wrangler.jsonc` = installer config: same Worker entry, R2 + DO + cron, **no routes**, neutral default `ALLOWED_ORIGINS`.
- `/health` answers even when `ALLOWED_ORIGINS` is empty (ops + Appflare probes).

### First catalog entry: Worker-only

- `plan: "paid"`, `requires: ["r2"]`, health `GET /health`
- `install.wranglerConfig`: `scripts/appflare/wrangler.jsonc`
- `install.buildCommand`: `pnpm --filter @mdviewer/worker run generate:llms`
- `install.installDirs`: `[{ "path": "." }]`

### Optional later: full product

Custom builder under `scripts/appflare/` that builds Vite + emits Worker assets + `/api` shim. Only after Worker-only packs clean.

## Manifest sketch (worker-only, paid)

```jsonc
{
  "$schema": "https://appflare.github.io/catalog/schema/v1.json",
  "slug": "mdviewer",
  "name": "MDViewer",
  "summary": "Protocol-3 markdown share API on Workers + R2 with manage token, optional view password, fixed TTL, and MCP.",
  "tagline": "Share markdown from your own Worker",
  "repo": "zamdevio/mdviewer",
  "license": "MIT",
  "categories": ["productivity", "utilities", "sharing"],
  "authors": [{ "name": "zamdevio", "github": "zamdevio" }],
  "maintainers": ["zamdevio"],
  "source": { "ref": "main", "sha": "/* packaging commit */" },
  "install": {
    "packageManager": "pnpm",
    "wranglerConfig": "scripts/appflare/wrangler.jsonc",
    "installDirs": [{ "path": "." }],
    "buildCommand": "pnpm --filter @mdviewer/worker run generate:llms",
    "health": { "path": "/health" }
  },
  "plan": "paid",
  "requires": ["r2"],
  "vars": [
    {
      "name": "ALLOWED_ORIGINS",
      "label": "Allowed SPA origins",
      "help": "Comma-separated https origins for CORS + share links (include your frontend)."
    }
  ]
}
```

## Checklist

- [x] Scaffold `scripts/appflare/` + Appflare-only wrangler — leave prod configs alone
- [x] `pnpm validate` + `pnpm pack-app` against a catalog fork
- [x] PR to `appflare/catalog` — [#536](https://github.com/appflare/catalog/pull/536) (0★ noted in PR body)
- [ ] After merge: optional Install badge on README

## Out of scope right now

- Claiming Appflare one-click for the Vite SPA while it remains Pages-only
