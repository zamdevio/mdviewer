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
| [`phases/focus.md`](phases/focus.md) | Current Focus (max 3) |
| [`final.md`](final.md) | Pre–v4.0 release checklist |
| [`phases/01-share-protocol.md`](phases/01-share-protocol.md) | Phase C — password / TTL / fair-use |
| [`phases/02-share-dialog.md`](phases/02-share-dialog.md) | Phase D — unified share dialog |
| [`phases/03-agent-surfaces.md`](phases/03-agent-surfaces.md) | Phase E — MCP / agent surfaces |
| [`phases/04-perf-large-docs.md`](phases/04-perf-large-docs.md) | Large markdown perf roadmap |
| [`systems/web.md`](systems/web.md) | Web app map |
| [`systems/worker.md`](systems/worker.md) | Worker API map |
| [`systems/pwa-cache.md`](systems/pwa-cache.md) | SW / Cache Storage migration rules |
| [`shipped/README.md`](shipped/README.md) | Closed-slice timeline |
| [`agents/tree.md`](agents/tree.md) | Directory conventions |
