# Maintainer directory

Contributor-only planning and systems maps. **`docs/`** is for public/helpful docs; **`maintainer/`** is internal.

**Agent guides:** [`agents/README.md`](agents/README.md)

---

## Layout

| Need | Where |
|------|--------|
| **What to build next** | [`phases/focus.md`](phases/focus.md) |
| **Pre–v4.0 checklist** | [`final.md`](final.md) |
| **What not to redo** | [`shipped/README.md`](shipped/README.md) |
| **How subsystems wire** | [`systems/README.md`](systems/README.md) |
| **Session scratch** | `temp/` (**gitignored**) |
| **Commit discipline** | [`agents/git.md`](agents/git.md) |

**Engine truth:** SPA in `apps/web` (Vite + React), Worker in `apps/worker` (Hono + OpenAPI), public notes in `docs/`.

**Versioning:** **3.x** until `final.md` is clear; release bump is **v4.0.0**.

---

## Entrypoints

| Doc | Role |
|-----|------|
| [`phases/focus.md`](phases/focus.md) | Focus order (Now / Next / Parked) |
| [`final.md`](final.md) | Pre–v4.0 release checklist |
| [`phases/04-perf-large-docs.md`](phases/04-perf-large-docs.md) | **Now** — large markdown perf (slice 4) |
| [`phases/06-appflare.md`](phases/06-appflare.md) | **Next** — Appflare catalog readiness |
| [`shipped/README.md`](shipped/README.md) | Closed-slice timeline + folded phase receipts |
| [`shipped/01-share-protocol.md`](shipped/01-share-protocol.md) | Folded — Phase C protocol |
| [`shipped/02-share-dialog.md`](shipped/02-share-dialog.md) | Folded — Phase D share dialog |
| [`shipped/03-agent-surfaces.md`](shipped/03-agent-surfaces.md) | Folded — Phase E MCP / agents |
| [`shipped/05-showcase.md`](shipped/05-showcase.md) | Folded — showcase honesty |
| [`shipped/07-manage-token.md`](shipped/07-manage-token.md) | Folded — protocol 3 manage token |
| [`shipped/08-share-ux.md`](shipped/08-share-ux.md) | Folded — share UX polish |
| [`systems/web.md`](systems/web.md) | Web app map |
| [`systems/worker.md`](systems/worker.md) | Worker API map |
| [`systems/pwa-cache.md`](systems/pwa-cache.md) | SW / Cache Storage migration rules |
| [`agents/tree.md`](agents/tree.md) | Directory conventions |

`phases/01`–`03`, `05`, `07`, `08` are **stubs** → `shipped/`. Do not extend stubs.
