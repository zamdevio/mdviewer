# Large-doc performance

**Focus label:** **Shipped / folded** ([`../phases/focus.md`](../phases/focus.md))  
**Order:** after protocol 3 + showcase visibility  
**Goal (original):** Smooth edit/preview toward large markdown.  
**Status:** Slices **0–3 shipped**; **slice 4 parked post-v4** (IndexedDB AST / table row virt / metrics). Editor textarea virt stays deferred.  
**Honest size claim (v4):** virtualized **preview** proven around **~2MB** (machine-dependent scroll/smoothness); **do not** advertise 5–10MB until [`../phases/parked.md`](../phases/parked.md) **perf-4** / **editor-virt**.
**Source:** Migrated from root `todo.md` (deleted). Paths updated for `apps/web`.

## Principles

1. Heavy renderers (Mermaid, Math, Code) never re-render on every keystroke
2. Typing only updates the preview shell; heavy work is debounced
3. Memoize / isolate heavy components
4. Client-side only for edit/preview
5. Virtualize and lazy-render what is off-screen

## Targets

| Size | Target |
|------|--------|
| &lt; 100KB | &lt; 100ms |
| 100KB–1MB | &lt; 1s |
| 1–5MB | &lt; 3s initial, smooth edit |
| 5–10MB | &lt; 5s initial, virtual scroll, &lt; 300MB RAM |

## P1 — Critical

- [x] Virtual scroll preview — `@tanstack/react-virtual` + h1/h2 chunks (`VirtualMarkdownViewer`); threshold `VIRTUALIZE_PREVIEW_BYTES` (100KB); editor PreviewSection + share page
- [ ] ~~Virtual scroll editor (optional)~~ — **Deferred**: editor is a plain `<textarea>` with cursor/spellcheck sync; real virt needs CodeMirror/Monaco (or custom line buffer). Revisit only if we replace the textarea.
- [x] IntersectionObserver lazy Mermaid (Code/Math still eager)
- [x] Chunked markdown parse in a Web Worker — `apps/web/src/lib/markdown/worker-parser.ts` + `parser.worker.ts` → hast; `HastDocument` in virtual preview
- [x] Content-hash incremental re-parse — `chunk-cache.ts` LRU (~200); unchanged chunks reuse hast (works for &gt;1MB and mid-doc edits)
- [ ] Progressive render: structure → text → heavy blocks
- [x] Cleanup Mermaid on unmount (abort in-flight + clear SVG DOM); KaTeX/highlighter still eager
- [x] LRU Mermaid cache (cap ~50)
- [ ] WeakMap caches where possible
- [x] Memory monitor + warn — `memory-monitor.ts` (Chromium; toast once at 75% on docs ≥100KB)
- [x] Dynamic Mermaid debounce (larger files → 1–1.5s) — `mermaidDebounceMs`
- [x] Size-aware preview debounce — `PreviewSection` + `previewDebounceMs`
- [x] Throttle scroll position tracking — `scroll.ts`
- [x] Longer auto-save debounce for large files — `autoSaveDebounceMs`

## P2 — Enhancements

- [x] Lazy-load syntax highlighter; auto-collapse &gt; 100 lines; highlight only near viewport (full code-block virt / HTML cache still open)
- [x] Skip remark-math / rehype-katex when chunk/doc has no math delimiters; KaTeX CSS on demand
- [x] Mermaid: current-theme only (no eager dual render); IO lazy; diagram size warning ≥4k chars; optional worker still open
- [ ] Virtualize large tables (rows ± columns); lazy when off-screen — **deferred to slice 4** (overflow-x scroll shipped)
- [x] Image `loading="lazy"` + `decoding="async"`; muted placeholder; one-shot size warning for huge naturals

## P3 — Advanced

- [ ] Heading-based chunking for &gt; 5MB + TOC section nav
- [ ] Perf metrics / warnings / optional dev dashboard
- [ ] IndexedDB AST cache for &gt; 1MB; content-hash invalidation
- [ ] Dynamic import Mermaid / KaTeX / highlighter; route-level code split (Vite)

## P4 — Robustness

- [ ] Warn before load &gt; 5MB; progressive load &gt; 10MB
- [ ] Memory-pressure handler
- [ ] Error boundaries per heavy block; partial render on parse errors; timeouts
- [ ] Feature detection / mobile buffer tuning

## Test plan (when started)

- [ ] Perf suite: 1 / 5 / 10MB docs — `tests/performance/large-docs.test.ts`
- [ ] Stress-test markdown fixture
- [ ] Memory leak open/close loop
- [ ] Manual: mid-range device + real large docs

## Slice order

| Slice | Scope | Status |
|-------|--------|--------|
| **0** | Size-aware preview debounce, Mermaid debounce/lazy/LRU, scroll throttle, auto-save scaling, memory warn | **Shipped** |
| **1** | Virtual scroll preview + lazy viewport blocks | **Shipped** (preview + share); editor virt **deferred** (textarea — no rewrite) |
| **2** | Chunked markdown parse in Web Worker + content-hash incremental | **Shipped** |
| **3** | Per-component opts (code / Mermaid / math / tables / images) | **Shipped** — scroll wrappers + virt badge; code collapse/lazy HL; Mermaid current-theme; skip-math; image lazy+warn; table *row* virt → 4 |
| **4** | Heading chunking / IndexedDB AST / metrics / robustness (P3–P4) + table row virt | **Parked post-v4** |

### Slice 2 acceptance

- [x] `worker-parser.ts` + `parser.worker.ts` parse off the main thread for virtualized docs
- [x] Content-hash LRU reuses unchanged chunk hast (incremental; covers &gt;1MB edits)
- [x] &lt;100KB keeps sync `ReactMarkdown` via `MarkdownViewer`
- [x] Unit coverage: `chunk-cache` / `parse-pipeline` / `worker-parser`; no Appflare / v4 in this slice

v4 ships with a **~2MB practical** large-preview claim (virt + worker); 5–10MB stays aspirational until [`../phases/parked.md`](../phases/parked.md) **perf-4** / **editor-virt**.

