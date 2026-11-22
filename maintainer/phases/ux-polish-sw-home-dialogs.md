# Phase A — SW, home, dialogs

**Status:** Shipped (implementation complete)  
**Depends on:** prior files tree + project pack slice committed

## Goals

- Normal reload (Ctrl+R) picks up new deploys — no hard refresh required
- ModalShell: outside-click + Esc + built-in close (X)
- Shared delete confirm for files and projects
- Home hero + feature showcase; README/docs reflect current product (and roadmap highlights without lying about unshipped worker password/TTL until those phases land)

## Checklist

- [x] SW: network-friendly asset strategy; auto-activate waiting worker; reload-loop guard; note in `maintainer/systems/pwa-cache.md`
- [x] ModalShell backdrop click fix + optional header with X
- [x] Delete confirm shared component for files + projects (tree)
- [x] Home: brand-first hero, below-fold features, 2–3 motions, mobile-safe
- [x] README + `docs/*` showcase (tree/DnD, project share pack, BYO API, PWA; mark password/TTL/MCP as coming soon only if mentioned)

## Out of scope

- Worker password / TTL / fair-use DO (Phase C)
- Lean trash (Phase B)
