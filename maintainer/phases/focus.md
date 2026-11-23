# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md) · **Pre–v4 gate:** [`../final.md`](../final.md)

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

**Rule:** Labels below are the order — **Now → Next → After that → Then → Parked**. No hard “max 3” cap; still **one vertical at a time** unless a note says parallel-safe. New chat: open this file, take **Now**, work its slices in the phase doc.

---

## Handoff (2026-11-23) — start here in a new chat

1. Read **this file**, then [`04-perf-large-docs.md`](./04-perf-large-docs.md) slice **3** leftovers.
2. **Do next:** remaining per-component opts (Mermaid / math / images lazy) — tables/code scroll + virt badge already landed.
3. **Do not:** Appflare pack (`06`) until Focus promotes **Next**; editor virt (textarea deferred); v4 bump; slice 4 until 3 lands.
4. **Names:** product + Wrangler Worker script = `mdviewer`; Pages = `markview`; API = `api.mdviewer.zamdev.dev`. MCP/`/compatibility.name` = `mdviewer`.
5. **Systems:** [`../systems/web.md`](../systems/web.md) · [`../systems/worker.md`](../systems/worker.md). Share UX 08 shipped.

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Large-doc perf — remaining slices | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |
| **Next** | Appflare packaging + catalog submit | [`06-appflare.md`](./06-appflare.md) |
| **Parked** | Nested projects / CSP nonce / ModalShell leftovers | [`../final.md`](../final.md) §7 |
| **Shipped** | Share UX — manage/compose/distribute + rotate results | [`08-share-ux.md`](./08-share-ux.md) |
| **Shipped** | Showcase honesty + visibility (MCP/llms) | [`05-showcase.md`](./05-showcase.md) |
| **Shipped** | Protocol 3 manage token | [`07-manage-token.md`](./07-manage-token.md) |
| **Shipped** | Share protocol 2 / dialog / agents | [`01`](./01-share-protocol.md)–[`03`](./03-agent-surfaces.md) |
| **Shipped** | Perf 0–2 (debounce/LRU + preview virt + worker parse; editor deferred) | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |

---

## Dependency chain

```txt
01–03 + 07 + 05 + 08 Share UX   (shipped)
  → 04 slices 0–2 shipped; slice 3 per-component next  ← Now (v4 claim: 1–2 done)
    → 06 Appflare pack + catalog PR     ← Next
  Parked: final.md §7
```

**Parallel-safe only when noted:** Appflare *docs/design* can stay current while 04 runs; **do not** implement `scripts/appflare/` until **Next**.

---

## Next task (do not guess)

1. [`04-perf-large-docs.md`](./04-perf-large-docs.md) — slice **3** per-component opts. Editor virt deferred.
2. Do **not** scaffold Appflare pack code until Focus promotes **Next**.
3. Do **not** bump **v4.0.0** until [`../final.md`](../final.md) is clear.

---

## Open phase index

| Doc | Label | Slices / notes |
|-----|-------|----------------|
| [`04-perf-large-docs.md`](./04-perf-large-docs.md) | **Now** | 0–2 **shipped** → **3** per-component → 4 |
| [`06-appflare.md`](./06-appflare.md) | **Next** / Declared | Pack → validate → catalog PR |
| [`08-share-ux.md`](./08-share-ux.md) | **Shipped** | 404 prune · rotate results · manage/compose/distribute |
| [`../final.md`](../final.md) §7 | **Parked** | Nested projects, CSP nonce, ModalShell |

---

## Guiding rules

- **One concern per PR** — scope from the active phase doc + current slice only.
- **No v4 without dual approval** — clear `final.md` first.
- Author for commits: **zamdevio \<me@zamdev.io\>**; commit/push when shipping.
