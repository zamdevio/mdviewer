# Web (`apps/web`)

- Entry: `src/main.tsx` → `app-shell/App.tsx`
- Router: `react-router-dom` routes for `/`, `/editor`, `/files`, `/search`, `/shares`, `/share`, `/settings`
- Theme: `next-themes` (works without Next)
- Local storage helpers: `src/lib/storage`
- Share client: `src/lib/api.ts` → Worker
- PWA: `src/pwa/sw.template.js` → Vite plugin emits `/sw.js` with `CACHE_VERSION` from `package.json`

## Share UX (protocol 3)

Dialog flow ([`../phases/08-share-ux.md`](../phases/08-share-ux.md)):

| Step | Component | Role |
|------|-----------|------|
| **Manage** | `ShareComposeDialog` | Bound link + Copy · Update (PUT) · New link · Delete share |
| **Compose** | same | TTL (create only) · view protect · rotate **view** password (PATCH) · existing link + copy |
| **Distribute** | `SharePanel` | Success copy/share sheet; **Back** → Compose |

Rules:

- Remote **DELETE 404** → treat as gone; prune local Shares row + clear `file`/`project` `shareId` (`lib/share/remote-delete.ts`). Do **not** delete Files/Editor body.
- Shares **Edit** Update only when a local file/project still has that `shareId`; else “open in Editor”.
- PUT does **not** slide `expiresAt` — Manage shows wipe time when known.

### Rotate **manage** token (Settings `#token`)

- `POST /share/rotate-manage` batched via `limits.rotateManageMaxIds`
- Results dialog: scrollable updated/failed rows + **View** per id (`RotateManageResultsDialog`)
- Persist new token if any id was re-keyed, or if failures are only `not_found`/`expired` (`lib/share/rotate-manage.ts`)
- Tombstones / unauthorized rows: optional local prune from results panel

Do not confuse with **rotate view password** (per-share PATCH in Compose).
