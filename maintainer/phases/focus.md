# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

All plans live under `maintainer/phases/`.

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Phase A — SW / home / dialogs | [`ux-polish-sw-home-dialogs.md`](./ux-polish-sw-home-dialogs.md) |
| 2 | Prior tree+pack slice | Commit if uncommitted, then A |
| 3 | — | Slot free |

## Queued — do not start

| # | Item | Doc |
|---|------|-----|
| 1 | Phase B — Lean trash | [`lean-trash.md`](./lean-trash.md) |
| 2 | Phase C — Worker password + fixed TTL + fair-use | [`share-password-protocol.md`](./share-password-protocol.md) |
| 3 | Phase D — Unified share dialog | [`share-dialog-unify.md`](./share-dialog-unify.md) |
| 4 | Phase E — llms.txt + MCP | [`agent-surfaces.md`](./agent-surfaces.md) |
| 5 | Large-doc performance | [`perf-large-docs.md`](./perf-large-docs.md) |
| 6 | Nested projects | [`files-share-selfhost.md`](./files-share-selfhost.md) follow-ups |

## Next task

1. Commit prior files tree / project pack / Vite defaults slice.
2. Implement Phase A (SW, ModalShell, delete confirms, home + README/docs showcase).
3. Promote Phase B into Focus only after A ships.
