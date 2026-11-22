# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

All plans live under `maintainer/phases/`.

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Commit + force-push reshape | Authors → `zamdevio <me@zamdev.io>`; WIP uncommitted |
| 2 | Feature design intake | Instinct share design + new feature list → phase docs |
| 3 | Hold feature implementation | After phase docs land |

## Queued — do not start

| # | Item | Doc |
|---|------|-----|
| 1 | Database-free share features | (pending design paste) |
| 2 | Large-doc performance | [`perf-large-docs.md`](./perf-large-docs.md) |
| 3 | UI polish | [`ui.md`](./ui.md) |

## Next task

1. Owner commits reshape + force-pushes rewritten `main` when ready.
2. Drop feature lists → sharpen into `phases/`.
3. Promote at most 3 items into Focus before coding.
