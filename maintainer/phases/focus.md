# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md) · **Pre–v4 gate:** [`../final.md`](../final.md)

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

**Rule:** Labels below are the order — **Now → Next → After that → Then → Parked**. No hard “max 3” cap; still **one vertical at a time** unless a note says parallel-safe. New chat: open this file, take **Now**, work its slices in the phase doc.

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Large-doc perf — remaining slices | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |
| **Next** | Appflare packaging + catalog submit | [`06-appflare.md`](./06-appflare.md) |
| **Parked** | Nested projects / CSP nonce / ModalShell leftovers | [`../final.md`](../final.md) §7 |
| **Shipped** | Showcase honesty (protocol 3) | [`05-showcase.md`](./05-showcase.md) |
| **Shipped** | Protocol 3 manage token | [`07-manage-token.md`](./07-manage-token.md) |
| **Shipped** | Share protocol 2 | [`01-share-protocol.md`](./01-share-protocol.md) |
| **Shipped** | Unified share dialog | [`02-share-dialog.md`](./02-share-dialog.md) |
| **Shipped** | Agent surfaces (MCP / llms) | [`03-agent-surfaces.md`](./03-agent-surfaces.md) |
| **Shipped** | Perf slice 1 (size-aware preview / Mermaid debounce) | folded into [`04-perf-large-docs.md`](./04-perf-large-docs.md) checklist |

---

## Dependency chain

```txt
01–03 + 07 protocol 3 + 05 showcase   (shipped)
  → 04 virtual scroll + worker parse  ← Now (v4 claim gate)
    → 06 Appflare pack + catalog PR     ← Next
  Parked: final.md §7 (not v4 blockers unless advertised)
```

**Parallel-safe only when noted:** Appflare *docs/design* can stay current while 04 runs; **do not** implement `scripts/appflare/` or open the catalog PR until **Next**.

---

## Next task (do not guess)

1. [`04-perf-large-docs.md`](./04-perf-large-docs.md) — remaining slices (virtual scroll → worker parse → …). Slice 1 debounce/LRU already shipped.
2. Do **not** scaffold Appflare pack code until Focus promotes **Next**.
3. Do **not** bump **v4.0.0** until [`../final.md`](../final.md) is clear (perf claim or explicit defer note).

---

## Open phase index

| Doc | Label | Slices / notes |
|-----|-------|----------------|
| [`04-perf-large-docs.md`](./04-perf-large-docs.md) | **Now** | 1 virtual scroll (open) → 2 worker parse → 3 per-component → 4 chunking/metrics; slice 1 debounce/LRU **shipped** |
| [`06-appflare.md`](./06-appflare.md) | **Next** / Declared | Pack `scripts/appflare/` → validate → catalog PR (`paid` + R2) |
| [`../final.md`](../final.md) §7 | **Parked** | Nested projects, CSP nonce, ModalShell |
| [`05-showcase.md`](./05-showcase.md) | **Shipped** | Protocol 3 honesty on README/home/docs/llms |
| [`07-manage-token.md`](./07-manage-token.md) | **Shipped** | Protocol 3 Worker + SPA + docs; prod smoke green |
| [`01`](./01-share-protocol.md)–[`03`](./03-agent-surfaces.md) | **Shipped** | Fold leftovers into systems/shipped when touching |

---

## Guiding rules

- **One concern per PR** — scope from the active phase doc + current slice only.
- **No v4 without dual approval** — clear `final.md` first.
- Author for commits: **zamdevio \<me@zamdev.io\>**; commit/push when shipping.
