# Share UX — manage / compose / distribute + rotate results

**Focus label:** **Shipped** ([`focus.md`](./focus.md))  
**Order:** ahead of remaining 04 / Appflare  
**Status:** Shipped on `share/ux-manage-flow`  
**Depends on:** Protocol 3 ([`07-manage-token.md`](./07-manage-token.md)), dialog shell ([`02-share-dialog.md`](./02-share-dialog.md))

## Goals

1. **Delete:** remote 404 / gone → prune local Shares row + clear `file`/`project` `shareId`; no hard error toast.
2. **Rotate manage token:** scrollable results (updated + failed + View); persist new token if any id re-keyed or failures are only tombstones; prune gone/orphan locally from panel.
3. **Share dialog steps:** **Manage** → **Compose** → **Distribute** (Back → Compose). Update = PUT; view password = PATCH; create = POST; Delete = remote + local only.
4. **Shares Edit:** Update only when local file/project has that `shareId`.

## Naming

| UI | API |
|----|-----|
| Rotate **manage** token | `POST /share/rotate-manage` (Settings) |
| Rotate / set **view** password | `PATCH /share/:id` |
| Update content | `PUT /share/:id` (does not slide `expiresAt`) |

## Checklist

- [x] 404-tolerant remote delete + local prune (`lib/share/remote-delete.ts`, `share-gone.ts`)
- [x] Rotate results dialog + persist rules (`RotateManageResultsDialog`, `lib/share/rotate-manage.ts`)
- [x] ShareCompose manage/compose + SharePanel Back
- [x] Wire editor + files + shares
- [x] `systems/` + `shipped/` + `docs/api.md` + `docs/getting-started.md`

## Systems / docs

- [`../systems/web.md`](../systems/web.md) — Share UX + rotate manage
- [`../systems/worker.md`](../systems/worker.md) — rotate failure codes
- [`../../docs/api.md`](../../docs/api.md) · [`../../docs/getting-started.md`](../../docs/getting-started.md)
