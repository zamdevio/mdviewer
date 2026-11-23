# PWA / service worker cache rules

**Rule:** Cache migrations must stay safe across version bumps. Document prefix / strategy changes here before shipping.

## Current contract

| Item | Value |
|------|--------|
| Source | `apps/web/src/pwa/sw.template.js` |
| Emitted | `/sw.js` via Vite plugin (`CACHE_VERSION` = full semver from `apps/web/package.json`) |
| Active cache name | `mdviewer-${CACHE_VERSION}` e.g. `mdviewer-v4.0.0` |
| Install | `skipWaiting()`; precache offline shell only (not SPA HTML routes) |
| Activate | delete **every** Cache Storage entry except the active name, then `clients.claim()` |
| HTML / navigations | network-only when online (offline → `/offline.html`) |
| Hashed `/assets/*` | network-first |
| Other static | stale-while-revalidate |
| Client | **no SW in Vite DEV**; prod activates waiting SW + reload on `controllerchange` |
| Pages HTML | `_headers` + `CDN-Cache-Control: no-store` on SPA shells; pretty `*.html` route files (not `route/index.html`) |

## Migration rules

1. Don’t rename the `mdviewer-` prefix without a release that still deletes both old and new names.
2. Bump `apps/web/package.json` when users need a forced cache rotate.
3. Activate wipes all non-current caches on this origin.
4. HTML stays network-first online so deploys aren’t trapped behind a stale shell.
5. Cache Storage clears must not wipe localStorage / IndexedDB app data.

## When changing SW behavior

1. Edit `sw.template.js`.
2. Bump web package version if a forced rotate is needed.
3. Note in [`../shipped/README.md`](../shipped/README.md).
4. Confirm DevTools → Cache Storage leaves only the current `mdviewer-v*`.

## Deploy coupling

Ship Pages + Worker together when CORS / API URL changes. See [`../../docs/deploy.md`](../../docs/deploy.md).
