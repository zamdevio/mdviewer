# Maintainer directory

Contributor-only planning and systems maps. **`docs/`** is for public/helpful docs; **`maintainer/`** is internal.

**Agent guides:** [`agents/README.md`](agents/README.md)

---

## Layout

| Need | Where |
|------|--------|
| **What to build next** | [`phases/focus.md`](phases/focus.md) |
| **Parked follow-ups** | [`phases/parked.md`](phases/parked.md) |
| **What not to redo** | [`shipped/README.md`](shipped/README.md) |
| **How subsystems wire** | [`systems/README.md`](systems/README.md) |
| **Session scratch** | `temp/` (**gitignored**) |
| **Commit discipline** | [`agents/git.md`](agents/git.md) |

**Engine truth:** SPA in `apps/web` (Vite + React), Worker in `apps/worker` (Hono + OpenAPI), public notes in `docs/`.

**Versioning:** **v4.0.0** line after the 2026-11-23 bump.

---

## Entrypoints

| Doc | Role |
|-----|------|
| [`phases/focus.md`](phases/focus.md) | Focus order (Now / Next / Parked) |
| [`phases/appflare.md`](phases/appflare.md) | **Next** — Appflare catalog (after v4) |
| [`phases/parked.md`](phases/parked.md) | Deferred slices (perf-4, editor-virt, …) |
| [`shipped/README.md`](shipped/README.md) | Closed-slice timeline + receipts |
| [`shipped/share-protocol.md`](shipped/share-protocol.md) | Share protocol (historical → protocol 3) |
| [`shipped/share-dialog.md`](shipped/share-dialog.md) | Unified share dialog |
| [`shipped/agent-surfaces.md`](shipped/agent-surfaces.md) | MCP / agent surfaces |
| [`shipped/showcase.md`](shipped/showcase.md) | Showcase honesty |
| [`shipped/perf-large-docs.md`](shipped/perf-large-docs.md) | Perf 0–3; ~2MB claim; slice 4 → parked |
| [`shipped/manage-token.md`](shipped/manage-token.md) | Protocol 3 manage token |
| [`shipped/share-ux.md`](shipped/share-ux.md) | Share UX polish |
| [`systems/web.md`](systems/web.md) | Web app map |
| [`systems/worker.md`](systems/worker.md) | Worker API map |
| [`systems/pwa-cache.md`](systems/pwa-cache.md) | SW / Cache Storage migration rules |
| [`agents/tree.md`](agents/tree.md) | Directory conventions |

Open `phases/`: `focus`, `appflare`, `parked` only. Receipts have **no** `NN-` prefixes.
