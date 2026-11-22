# Phase D — Unified share dialog

**Order:** 02  
**Status:** Shipped  
**Depends on:** Phase C ([`01-share-protocol.md`](./01-share-protocol.md))

## Goals

One Share dialog for editor, file, and project/folder. Local `shareId` binding. Re-share: new link vs replace. Shares page remote DELETE.

## UX

- Protect-view toggle (disabled → open Settings `#password` in **new tab**)
- Yellow warn when public view / missing password
- TTL picker: default 7d, custom ≤30d, show wipe time from `expiresAt`
- New link vs update existing when `shareId` already bound
- Same success dialog everywhere (copy / share sheet)

## Checklist

- [x] Persist `shareId` on SavedFile / Project
- [x] Shared dialog component wired from editor + files tree/grid
- [x] PUT replace vs POST new
- [x] Shares page DELETE with password
- [x] Settings `#password` section (auto-gen + copy)
