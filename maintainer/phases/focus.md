# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md)

**Parked:** [`parked.md`](./parked.md)

**Versioning:** **4.0.0** (shipped 2026-11-23).

**Rule:** Labels — **Now → Next → Parked**. One vertical at a time. New chat: open this file, take **Now**.

`phases/` open docs: `focus`, `appflare`, `parked`. Receipts under [`../shipped/`](../shipped/) (no `NN-` prefixes).

---

## Handoff (2026-11-23)

1. Read **this file**.
2. **Now / Next:** [`appflare.md`](./appflare.md) — catalog PR [#536](https://github.com/appflare/catalog/pull/536); badge after merge.
3. **Parked:** [`parked.md`](./parked.md) — perf-4, editor-virt, nested projects, CSP nonce, ModalShell leftovers.
4. **Names:** product + Wrangler Worker = `mdviewer`; Pages = `markview`; API = `api.mdviewer.zamdev.dev`.
5. **Honest large-doc claim:** ~2MB virtualized preview (machine-dependent); no 5–10MB.

**Agreed (human + agent, 2026-11-23):** ~2MB claim; park perf-4 + editor-virt; Appflare after v4; parked items stay parked.

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Appflare packaging + catalog | [`appflare.md`](./appflare.md) |
| **Parked** | Deferred slices | [`parked.md`](./parked.md) |

---

## Dependency chain

```txt
v4.0.0 shipped
  → appflare          ← Now
  Parked: parked.md
```

---

## Next task (do not guess)

1. [`appflare.md`](./appflare.md) slices 1→3 (scaffold → validate/pack → catalog PR).
2. Do **not** unpark [`parked.md`](./parked.md) items unless Focus says so.

---

## Guiding rules

- **One concern per PR**
- Author: **zamdevio \<me@zamdev.io\>**
