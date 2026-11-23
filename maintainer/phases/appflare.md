# Appflare catalog readiness

**Focus label:** **Now** ([`focus.md`](./focus.md))  
**Order:** packaging + catalog **after** v4.0.0 ships  
**Goal:** Make MDViewer installable via [Appflare](https://appflare.dev/) and submit to [appflare/catalog](https://github.com/appflare/catalog) when packaging is green.  
**Status:** **Ready — Focus Now after v4.0.0** — design/docs ok to keep warm; **implement when taking Focus Now**  
**Agent submit guide:** https://appflare.dev/agent/submit.md

## Slices

| Slice | Scope |
|-------|--------|
| **1** | Scaffold `scripts/appflare/` + Appflare-only wrangler (leave prod configs alone) |
| **2** | `pnpm validate` + `pnpm pack-app` against a catalog fork; health green |
| **3** | Manifest (protocol 3 summary, `paid`, `r2`) → PR to `appflare/catalog` |
| **4** | Optional Install badge; later full-product SPA+API pack if wanted |

## How submission works

- Catalog entry lives in **appflare/catalog**, not here: `apps/<slug>/appflare.jsonc` + PR.
- Upstream keeps normal deploy paths; Appflare uses **dedicated** packaging under `scripts/appflare/` (planned) — never rewrite production `wrangler.jsonc` / Pages flow.
- CI on their side: validate → pack pinned commit → install/health check.

## Stars (not a hard wall)

Public docs still say ≥50★ and under-bar PRs may auto-close — but **live catalog apps often sit under 50** (e.g. Cut ~24, others down to single digits / 0 on Appflare instances). Treat 50 as a **soft / negotiable** bar: submit when the pack is solid and the repo is legit; talk to maintainers if CI nags on stars.

| Gate | Status | Notes |
|------|--------|-------|
| Public GitHub repo | ✅ | `zamdevio/mdviewer` |
| Stars | Soft | Grow when we can; not a reason to stall packaging design |
| Deploys with wrangler | ⚠️ | Worker yes; SPA is Pages today |
| Self-contained DO | ✅ | `RateLimiter` in worker |
| License | ✅ | MIT |
| Plan | **`paid`** | Cron TTL sweep → declare paid (honest for Appflare) |
| `requires` | `["r2"]` | Share storage |

## Packaging shape (agreed direction)

### Dedicated Appflare surface (no touch to normal configs)

- Keep `apps/worker/wrangler.jsonc` + Pages deploy as the day-to-day path.
- Add later (when implementing, not now):
  - `scripts/appflare/` — build/unify helper
  - Appflare-only wrangler / entry (e.g. `.appflare.wrangler.jsonc` or generated under `scripts/appflare/out/`) that can serve SPA assets at `/` and API under `/api/*` **if** we choose full-product install
- Catalog `install.buildCommand` points at that script; `wranglerConfig` points at the **Appflare-only** config.

### Recommended first catalog entry

**Worker-only (share API)** still the smallest honest first PR:

- `plan: "paid"`, `requires: ["r2"]`, health `GET /health`
- Neutralize installer-hostile bits (custom domain routes, personal `ALLOWED_ORIGINS`) via Appflare-only config / `configPatch` / vars — **not** by editing prod wrangler for everyone

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
  "categories": ["productivity", "utilities"],
  "authors": [{ "name": "zamdevio", "github": "zamdevio" }],
  "maintainers": ["/* your gh login */"],
  "source": { "ref": "/* tag or main */", "sha": "/* 40-char */" },
  "install": {
    "packageManager": "pnpm",
    "wranglerConfig": "apps/worker/wrangler.jsonc",
    "installDirs": [{ "path": "." }, { "path": "apps/worker" }],
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

When `scripts/appflare/` exists, flip `wranglerConfig` / `buildCommand` to those paths.

## Checklist

- [ ] (Later) Scaffold `scripts/appflare/` + Appflare-only wrangler — leave prod configs alone
- [ ] `pnpm validate` + `pnpm pack-app` against a catalog fork
- [ ] User confirms manifest → PR to `appflare/catalog` (push back on stars if needed)
- [ ] After merge: optional Install badge on README

## Out of scope right now

- Implementing `scripts/appflare/` (docs-only until Focus says go)
- Claiming Appflare one-click for the Vite SPA while it remains Pages-only
