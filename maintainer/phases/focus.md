# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Versioning:** Ship **3.x.x** until [`../final.md`](../final.md) is cleared; then **v4.0.0**.

Active phase docs (implement order): `01`–`03` shipped → **`07`** (protocol 3) → `04` → `05` → `06`.

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Manage token + view-password split | [`07-manage-token.md`](./07-manage-token.md) — protocol 3; settings `#token`; disposable view passwords; Shares Edit parity; bulk rotate |
| 2 | Large-doc performance | [`04-perf-large-docs.md`](./04-perf-large-docs.md) — virtual scroll after cleanup |
| 3 | Appflare readiness | [`06-appflare.md`](./06-appflare.md) — **declared**: catalog submit when pack is green; docs/`scripts/appflare/` path; paid + stars soft |

## Queued — do not start

| # | Item | Doc |
|---|------|-----|
| 1 | Showcase honesty pass | [`05-showcase.md`](./05-showcase.md) — after 07 copy lands in llms/README |
| 2 | Nested projects + other loose ends | [`../final.md`](../final.md) §7 |
| 3 | Appflare catalog PR | After `scripts/appflare/` packs clean ([`06-appflare.md`](./06-appflare.md)) |

## Next task

1. Spec locked in [`07-manage-token.md`](./07-manage-token.md) — implement Worker auth split + SPA `#token` + already-shared/Shares Edit, then llms/OpenAPI.
2. Phase 04 virtual scroll when 07 is far enough not to thrash share UX.
3. Appflare: keep packaging design current; submit when Worker-only (or full) pack is honest.
