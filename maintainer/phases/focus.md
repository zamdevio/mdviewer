# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md) · **Pre–v4 gate:** [`../final.md`](../final.md)

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

**Rule:** Labels below are the order — **Now → Next → After that → Then → Parked**. No hard “max 3” cap; still **one vertical at a time** unless a note says parallel-safe. New chat: open this file, take **Now**, work its slices in the phase doc.

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Protocol 3 — manage token vs disposable view password | [`07-manage-token.md`](./07-manage-token.md) |
| **Next** | Showcase honesty (protocol 3 surfaces) | [`05-showcase.md`](./05-showcase.md) |
| **After that** | Large-doc perf — remaining slices | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |
| **Then** | Appflare packaging + catalog submit | [`06-appflare.md`](./06-appflare.md) |
| **Parked** | Nested projects / CSP nonce / ModalShell leftovers | [`../final.md`](../final.md) §7 |
| **Shipped** | Share protocol 2 | [`01-share-protocol.md`](./01-share-protocol.md) |
| **Shipped** | Unified share dialog | [`02-share-dialog.md`](./02-share-dialog.md) |
| **Shipped** | Agent surfaces (MCP / llms) | [`03-agent-surfaces.md`](./03-agent-surfaces.md) |
| **Shipped** | Perf slice 1 (size-aware preview / Mermaid debounce) | folded into [`04-perf-large-docs.md`](./04-perf-large-docs.md) checklist |

---

## Dependency chain

```txt
01 protocol 2 + 02 dialog + 03 agents   (shipped)
  → 07 manage-token / protocol 3        ← Now
    → 05 showcase honesty               ← Next (docs/llms/README match protocol 3)
    → 04 virtual scroll + worker parse  ← After that (v4 claim gate)
    → 06 Appflare pack + catalog PR     ← Then (declared; describe protocol 3 once live)
  Parked: final.md §7 (not v4 blockers unless advertised)
```

**Parallel-safe only when noted:** Appflare *docs/design* can stay current while 07 runs; **do not** implement `scripts/appflare/` or open the catalog PR until **Then**. Showcase wait until 07’s llms/OpenAPI land so the honesty pass isn’t rewriting twice.

---

## Next task (do not guess)

1. [`07-manage-token.md`](./07-manage-token.md) — **Slice A** Worker auth split + protocol 3 + bulk rotate; then SPA `#token` / already-shared / Shares Edit; then docs/MCP. Follow slices in that doc only.
2. Do **not** start virtual scroll ([`04`](./04-perf-large-docs.md)) until 07 is folded or Focus promotes it.
3. Do **not** rewrite showcase copy for protocol 2 — wait for 07, then run [`05`](./05-showcase.md).
4. Do **not** scaffold Appflare pack code until **Then**.
5. Do **not** bump **v4.0.0** until [`../final.md`](../final.md) is clear (protocol 3 + perf claim or explicit defer note).

---

## Open phase index

| Doc | Label | Slices / notes |
|-----|-------|----------------|
| [`07-manage-token.md`](./07-manage-token.md) | **Now** | A Worker → B SPA settings/dialog → C Shares Edit → D MCP/llms/OpenAPI → E migrate + smoke |
| [`05-showcase.md`](./05-showcase.md) | **Next** | Single honesty pass after 07; checklist in doc |
| [`04-perf-large-docs.md`](./04-perf-large-docs.md) | **After that** | 1 virtual scroll (open) → 2 worker parse → 3 per-component → 4 chunking/metrics; slice 1 debounce/LRU **shipped** |
| [`06-appflare.md`](./06-appflare.md) | **Then** / Declared | Pack `scripts/appflare/` → validate → catalog PR (`paid` + R2) |
| [`../final.md`](../final.md) §7 | **Parked** | Nested projects, CSP nonce, ModalShell |
| [`01`](./01-share-protocol.md)–[`03`](./03-agent-surfaces.md) | **Shipped** | Fold leftovers into systems/shipped when touching |

---

## Guiding rules

- **One concern per PR** — scope from the active phase doc + current slice only.
- **Protocol before polish** — 07 lands before showcase/Appflare claims about auth.
- **No v4 without dual approval** — clear `final.md` first.
- Author for commits: **zamdevio \<me@zamdev.io\>**; commit/push when shipping.
