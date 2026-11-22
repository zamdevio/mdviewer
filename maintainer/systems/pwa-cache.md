# PWA / service worker cache rules

**Rule:** Cache migrations must be safe across app generations (Next → Vite, version bumps). Document every prefix change here before shipping.

## Current contract

| Item | Value |
|------|--------|
| Source | `apps/web/src/pwa/sw.template.js` |
| Emitted | `/sw.js` via Vite plugin (`CACHE_VERSION` = full semver from `apps/web/package.json`) |
| Active cache name | `mdviewer-${CACHE_VERSION}` e.g. `mdviewer-v3.8.3` |
| Install | `skipWaiting()`; precache only offline shell assets (not SPA HTML routes) |
| Activate | delete **every** Cache Storage entry except the active name, then `clients.claim()` |
| HTML / navigations | network-only online (offline → `/offline.html`) — avoids stale shell |
| Hashed `/assets/*` | network-first (cache on success) so Ctrl+R picks up deploys |
| Other static | stale-while-revalidate |
| Client | **no SW in Vite DEV** (unregister + clear **all** caches); prod auto-activates waiting SW + reload on `controllerchange` |
| Pages `_headers` | `/` and `/index.html` → `Cache-Control: public, max-age=0, must-revalidate` (CDN must not hold SPA shell) |

## Migration rules (do not break)

1. **Never rename the `mdviewer-` prefix** without a release that still deletes both old and new names.
2. **Version bumps** bump `apps/web/package.json` → new `CACHE_VERSION` → activate clears previous caches.
3. **Activate wipes all non-current caches** on this origin (covers leftover Next / Workbox / old `mdviewer-*`). Safe because only this app’s SW should be registering here.
4. **HTML stays network-first** so a new deploy is not trapped behind a stale shell when online.
5. **localStorage / IndexedDB app data** is separate from Cache Storage — SW cache clears must not imply “wipe user files.”

## When changing SW behavior

1. Update `sw.template.js`.
2. Bump web package version if users need a forced cache rotate.
3. Note the change in [`../shipped/README.md`](../shipped/README.md).
4. Verify activate leaves only `mdviewer-v*` current in DevTools → Application → Cache Storage.

## Deploy coupling

GitHub Actions (Cloudflare Pages + Worker) should ship web + worker together when CORS / API URL changes. See [`../../docs/deploy.md`](../../docs/deploy.md) and [`.github/workflows/`](../../.github/workflows/).

After a bad edge cache (e.g. custom domain still serving `_next`), purge the Pages custom-domain cache or wait for `_headers` + new SW activate — `*.pages.dev` may already be clean while the custom hostname lags.
