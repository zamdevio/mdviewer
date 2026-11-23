# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md) · **Pre–v4 gate:** [`../final.md`](../final.md)

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

**Rule:** Labels below are the order — **Now → Next → Parked**. One vertical at a time unless a note says parallel-safe. New chat: open this file, take **Now**.

Completed phases are **deleted** from `phases/` — receipts only under [`../shipped/`](../shipped/). Open docs here: `focus`, `04`, `06`.

---

## Handoff (2026-11-23) — start here in a new chat

1. Read **this file**, then [`04-perf-large-docs.md`](./04-perf-large-docs.md) **slice 4**.
2. **Do next:** slice 4 — heading chunking / IndexedDB AST / metrics / robustness + table row virt. Editor textarea virt stays deferred.
3. **Do not:** Appflare pack (`06`) until Focus promotes **Next**; v4 bump; claim full 5–10MB until slice 4 / `final.md` §6 cleared or deferred in release notes.
4. **Names:** product + Wrangler Worker script = `mdviewer`; Pages = `markview`; API = `api.mdviewer.zamdev.dev`. MCP/`/compatibility.name` = `mdviewer`.
5. **Systems:** [`../systems/web.md`](../systems/web.md) · [`../systems/worker.md`](../systems/worker.md).

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Large-doc perf — slice 4 | [`04-perf-large-docs.md`](./04-perf-large-docs.md) |
| **Next** | Appflare packaging + catalog submit | [`06-appflare.md`](./06-appflare.md) |
| **Parked** | Nested projects / CSP nonce / ModalShell leftovers | [`../final.md`](../final.md) §7 |

Folded (receipts only): [`../shipped/README.md`](../shipped/README.md) — protocol 01–03, showcase 05, manage token 07, share UX 08, perf 0–3 notes.

---

## Dependency chain

```txt
01–03 + 07 + 05 + 08   (shipped / folded)
  → 04 slices 0–3 shipped; slice 4 next  ← Now
    → 06 Appflare pack + catalog PR     ← Next
  Parked: final.md §7
```

**Parallel-safe only when noted:** Appflare *docs/design* can stay current while 04 runs; **do not** implement `scripts/appflare/` until **Next**.

---

## Next task (do not guess)

1. [`04-perf-large-docs.md`](./04-perf-large-docs.md) — **slice 4**. Editor virt deferred.
2. Do **not** scaffold Appflare pack until Focus promotes **Next**.
3. Do **not** bump **v4.0.0** until [`../final.md`](../final.md) is clear.

---

## Open phase index

| Doc | Label | Notes |
|-----|-------|-------|
| [`04-perf-large-docs.md`](./04-perf-large-docs.md) | **Now** | 0–3 shipped → **4** next |
| [`06-appflare.md`](./06-appflare.md) | **Next** / Declared | Pack → validate → catalog PR |
| [`../final.md`](../final.md) §7 | **Parked** | Nested projects, CSP nonce, ModalShell |

---

## Guiding rules

- **One concern per PR** — scope from the active phase doc + current slice only.
- **No v4 without dual approval** — clear `final.md` first.
- Author for commits: **zamdevio \<me@zamdev.io\>**; commit/push when shipping.
