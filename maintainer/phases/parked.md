# Parked

Work deferred past **v4.0.0**. Not blockers. Pick up from Focus when promoted.

**Related receipts:** [`../shipped/perf-large-docs.md`](../shipped/perf-large-docs.md) · systems [`../systems/web.md`](../systems/web.md)

---

## Slices

| Slice | Scope | Notes |
|-------|--------|--------|
| **perf-4** | Heading chunking / IndexedDB AST / metrics / robustness + table row virt | Was 04 slice 4. No 5–10MB claim until this + editor virt. |
| **editor-virt** | Virtualize / replace plain `<textarea>` (CodeMirror/Monaco or custom) | Deferred — cursor/spellcheck sync makes this a rewrite. |
| **nested-projects** | Nested project folders in Files tree | Optional; don’t advertise until shipped. |
| **csp-nonce** | Prefer nonce over `script-src 'unsafe-inline'` for theme bootstrap | Security harden follow-up. |
| **modalshell-settings** | Finish Settings portals → `ModalShell` where still open | UX consistency. |

---

## Order hint (when unparking)

1. **perf-4** / **editor-virt** — only if we want a stronger large-doc claim  
2. **csp-nonce** — small harden  
3. **modalshell-settings** / **nested-projects** — polish

Appflare is **not** parked here — see [`appflare.md`](./appflare.md) (Focus **Next** after v4).
