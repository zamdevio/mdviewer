# Focus

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

**Systems maps:** [`../systems/README.md`](../systems/README.md) · **Pre–v4 gate:** [`../final.md`](../final.md)

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

**Rule:** Labels below are the order — **Now → Next → Parked**. One vertical at a time. New chat: open this file, take **Now**.

Completed phases are **deleted** from `phases/` — receipts under [`../shipped/`](../shipped/). Open here: `focus`, `06` (after v4).

---

## Handoff (2026-11-23) — start here in a new chat

1. Read **this file** + [`../final.md`](../final.md).
2. **Do next:** finish pre-v4 gate — `#heading` smoke (human), dual-approve §8, deploy current `main`, **then** bump **4.0.0** (no v4 before that deploy).
3. **After v4:** Appflare pack ([`06-appflare.md`](./06-appflare.md)). Perf slice 4 parked ([`../shipped/04-perf-large-docs.md`](../shipped/04-perf-large-docs.md)).
4. **Names:** product + Wrangler Worker = `mdviewer`; Pages = `markview`; API = `api.mdviewer.zamdev.dev`.
5. **Honest large-doc claim:** ~2MB virtualized preview (machine-dependent); no 5–10MB claim.

---

## Focus order

| Label | Vertical | Doc |
|-------|----------|-----|
| **Now** | Clear `final.md` → deploy → **v4.0.0** | [`../final.md`](../final.md) |
| **Next** | Appflare packaging + catalog (after v4) | [`06-appflare.md`](./06-appflare.md) |
| **Parked** | Perf slice 4 / nested projects / CSP / ModalShell | [`../shipped/04-perf-large-docs.md`](../shipped/04-perf-large-docs.md) · [`../final.md`](../final.md) §7 |

---

## Dependency chain

```txt
01–05 + 07–08 + 04 slices 0–3   (shipped / folded)
  → final.md clear + deploy + v4.0.0   ← Now
    → 06 Appflare                      ← Next (after v4)
  Parked: 04 slice 4, final §7
```

---

## Next task (do not guess)

1. Human: `#heading` smoke on editor + [heading share](https://mdviewer.zamdev.dev/share/35668cac054792ba7ce8cc7ddb38b2fc).
2. Dual-approve [`../final.md`](../final.md) §8 (deferred notes already set for Appflare / 5–10MB / parked).
3. Deploy `main` → bump **4.0.0** → tag → redeploy. **No v4 before final deploy.**
4. Then Appflare (`06`).

---

## Guiding rules

- **One concern per PR**
- **No v4 without dual approval** — clear `final.md` first; deploy before bump.
- Author: **zamdevio \<me@zamdev.io\>**
