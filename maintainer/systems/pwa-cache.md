# PWA / service worker cache rules

**Rule:** Cache migrations must be safe across app generations (Next → Vite, version bumps). Document every prefix change here before shipping.

## Current contract

| Item | Value |
|------|--------|
| Source | `apps/web/src/pwa/sw.template.js` |
| Emitted | `/sw.js` via Vite plugin (`CACHE_VERSION` from `apps/web/package.json` major.minor) |
| Active cache name | `mdviewer-${CACHE_VERSION}` e.g. `mdviewer-v3.4` |
| Install | `skipWaiting()`; precache only offline shell assets (not SPA HTML routes) |
| Activate | delete non-current caches matching legacy prefixes, then `clients.claim()` |
| HTML / navigations | network-only online (offline → `/offline.html`) — avoids stale shell |
| Hashed `/assets/*` | network-first (cache on success) so Ctrl+R picks up deploys |
| Other static | stale-while-revalidate |
| Client | **no SW in Vite DEV** (unregister + clear caches); prod auto-activates waiting SW + reload on `controllerchange` |

## Migration rules (do not break)

1. **Never rename the `mdviewer-` prefix** without a release that still deletes both old and new names.
2. **Version bumps** bump `apps/web/package.json` → new `CACHE_VERSION` → activate clears previous `mdviewer-*`.
3. **Legacy shells** on the same origin (old Next / Workbox) are cleared via `LEGACY_CACHE_PREFIXES` in the SW template. Add prefixes there **and** here when discovering leftovers in the wild.
4. **Do not** wipe unrelated origin caches; only known MDViewer / prior-app prefixes.
5. **HTML stays network-first** so a new deploy is not trapped behind a stale shell when online.
6. **localStorage / IndexedDB app data** is separate from Cache Storage — SW cache clears must not imply “wipe user files.”

## When changing SW behavior

1. Update `sw.template.js`.
2. Bump web package version if users need a forced cache rotate.
3. Note the change in [`../shipped/README.md`](../shipped/README.md).
4. Verify activate deletes old `mdviewer-*` in DevTools → Application → Cache Storage.

## Deploy coupling

GitHub Actions (Cloudflare Pages + Worker) should ship web + worker together when CORS / API URL changes. See [`../../docs/deploy.md`](../../docs/deploy.md) and [`.github/workflows/`](../../.github/workflows/).
