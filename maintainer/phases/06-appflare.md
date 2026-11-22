# Appflare catalog readiness

**Order:** 06  
**Goal:** Make MDViewer installable via [Appflare](https://appflare.dev/) and submit to [appflare/catalog](https://github.com/appflare/catalog) when gates pass.  
**Status:** Queued — **blocked on stars + packaging shape**  
**Agent submit guide:** https://appflare.dev/agent/submit.md

## How submission works

- Catalog entry lives in **appflare/catalog**, not in this repo: `apps/<slug>/appflare.jsonc` + PR.
- Upstream repo stays as-is (optional Install badge later).
- CI on their side: validate manifest → pack pinned commit → install/health check.

## Qualification gates (honest)

| Gate | Status | Notes |
|------|--------|-------|
| Public GitHub repo | ✅ | `zamdevio/mdviewer` |
| ≥ **50 stars** | ❌ | Currently **0** — PRs under the bar are auto-closed |
| Deploys with wrangler | ⚠️ | Worker: `apps/worker/wrangler.jsonc`. SPA today: **Pages** (`pages deploy`), not a Worker `assets` app |
| Self-contained DO/Workflows | ✅ | `RateLimiter` defined in worker |
| License | ✅ | MIT |
| Plan | **`paid`** | Cron TTL sweep (`triggers.crons`) needs Workers Paid |
| `requires` | `["r2"]` | Share storage |

## Packaging shapes (pick before writing manifest)

### A — Worker-only (share API) — recommended first

- Catalog installs `apps/worker` only (`wranglerConfig`: `apps/worker/wrangler.jsonc`).
- Health: `GET /health`.
- SPA stays on Pages / self-host; README documents pairing `ALLOWED_ORIGINS` + frontend URL.
- Pros: fits Appflare model now. Cons: not a one-click full product.

### B — Full product (SPA + API)

- Need SPA as **Worker static assets** (or second Worker in “several Workers” entry), not Cloudflare Pages project name.
- Larger change: `apps/web` wrangler assets binding + CORS vars for installer’s origins.
- Pros: true one-click. Cons: non-trivial migrate off Pages deploy path.

**Do not submit until A or B is chosen and pack-app succeeds locally.**

## Manifest sketch (shape A)

```jsonc
{
  "$schema": "https://appflare.github.io/catalog/schema/v1.json",
  "slug": "mdviewer-api",
  "name": "MDViewer API",
  "summary": "Protocol-2 markdown share API on Workers + R2 with optional password, fixed TTL, and MCP.",
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

Hardcoded `routes` / `zone_name` / prod `ALLOWED_ORIGINS` in our wrangler must be neutralized for installers via upstream PR + `configPatch` (or a `wrangler.appflare.jsonc` template) — track as a readiness task.

## Checklist

- [ ] Hit 50★ (or document delay)
- [ ] Choose shape A vs B
- [ ] Strip/patch installer-hostile wrangler bits (custom domain routes, personal ALLOWED_ORIGINS)
- [ ] Confirm `predeploy` / `generate:llms` works under pack-app (no CF credentials)
- [ ] Draft `appflare.jsonc` in a catalog fork; `pnpm validate` + `pnpm pack-app`
- [ ] User confirms manifest → PR to `appflare/catalog`
- [ ] After merge: optional Install badge on README ([badge docs](https://appflare.dev/catalog/install-badge/))

## Out of scope until gates clear

- Opening the catalog PR with 0 stars
- Claiming Appflare one-click for the Vite SPA while it remains Pages-only
