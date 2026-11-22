# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

Active phase docs (implement order): `01` → `02` → `03` → `04`.

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Phase C — Worker password + fixed TTL + fair-use | [`01-share-protocol.md`](./01-share-protocol.md) |
| 2 | — | Slot free |
| 3 | — | Slot free |

## Queued — do not start

| # | Item | Doc |
|---|------|-----|
| 1 | Phase D — Unified share dialog | [`02-share-dialog.md`](./02-share-dialog.md) |
| 2 | Phase E — MCP (+ optional worker llms) | [`03-agent-surfaces.md`](./03-agent-surfaces.md) |
| 3 | Large-doc performance | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |
| 4 | Nested projects + other loose ends | [`../final.md`](../final.md) §7 |

## Next task

1. Phases A–B and earlier slices are shipped — see [`../shipped/README.md`](../shipped/README.md).
2. Implement Phase C ([`01-share-protocol.md`](./01-share-protocol.md)).
3. Promote D → E → perf via Focus; track gaps in [`../final.md`](../final.md).
