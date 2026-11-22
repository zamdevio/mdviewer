# Maintainer directory

Contributor-only planning and systems maps. **`docs/`** is for public/helpful docs; **`maintainer/`** is internal.

**Agent guides:** [`agents/README.md`](agents/README.md)

---

## Layout

| Need | Where |
|------|--------|
| **What to build next** | [`phases/focus.md`](phases/focus.md) |
| **What not to redo** | [`shipped/README.md`](shipped/README.md) |
| **How subsystems wire** | [`systems/README.md`](systems/README.md) |
| **Session scratch** | `temp/` (**gitignored**) |
| **Commit discipline** | [`agents/git.md`](agents/git.md) |

**Engine truth:** SPA in `apps/web` (Vite + React), Worker in `apps/worker` (Hono + OpenAPI), public notes in `docs/`.

---

## Entrypoints

| Doc | Role |
|-----|------|
| [`phases/focus.md`](phases/focus.md) | Current Focus (max 3) |
| [`phases/platform.md`](phases/platform.md) | Open platform / reshape notes |
| [`phases/perf-large-docs.md`](phases/perf-large-docs.md) | Large markdown perf roadmap |
| [`phases/ui.md`](phases/ui.md) | UI polish (home, shell, empty states) |
| [`phases/files-share-selfhost.md`](phases/files-share-selfhost.md) | Projects/tree, BYO share API, badge dialogs |
| [`systems/web.md`](systems/web.md) | Web app map |
| [`systems/worker.md`](systems/worker.md) | Worker API map |
| [`systems/pwa-cache.md`](systems/pwa-cache.md) | SW / Cache Storage migration rules |
| [`shipped/README.md`](shipped/README.md) | Closed-slice timeline |
| [`agents/tree.md`](agents/tree.md) | Directory conventions |
