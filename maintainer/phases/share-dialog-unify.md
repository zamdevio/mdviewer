# Phase D — Unified share dialog

**Status:** Queued  
**Depends on:** Phase C (worker protocol)

## Goals

One Share dialog for editor, file, and project/folder. Local `shareId` binding. Re-share: new link vs replace. Shares page remote DELETE.

## UX

- Protect-view toggle (disabled → open Settings `#password` in **new tab**)
- Yellow warn when public view / missing password
- TTL picker: default 7d, custom ≤30d, show wipe time from `expiresAt`
- New link vs update existing when `shareId` already bound
- Same success dialog everywhere (copy / share sheet)

## Checklist

- [ ] Persist `shareId` on SavedFile / Project
- [ ] Shared dialog component wired from editor + files tree/grid
- [ ] PUT replace vs POST new
- [ ] Shares page DELETE with password
- [ ] Settings `#password` section (auto-gen + copy)
