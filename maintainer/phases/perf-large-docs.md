# Large-doc performance

**Goal:** Smooth edit/preview for 5–10MB markdown.  
**Status:** Queued (do not start until Focus frees a slot).  
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

- [ ] Virtual scroll preview — `apps/web/src/components/pages/editor/PreviewSection.tsx`
- [ ] Virtual scroll editor (optional) — `EditorSection.tsx`
- [ ] IntersectionObserver lazy Mermaid / Code / Math
- [ ] Chunked markdown parse in a Web Worker — `apps/web/src/lib/markdown/worker-parser.ts`
- [ ] Diff-based re-parse for files &gt; 1MB — `viewer.tsx`
- [ ] Progressive render: structure → text → heavy blocks
- [ ] Cleanup Mermaid / KaTeX / highlighter on unmount
- [ ] LRU Mermaid cache (cap ~50)
- [ ] WeakMap caches where possible
- [ ] Memory monitor + warn — `apps/web/src/lib/performance/memory-monitor.ts`
- [ ] Dynamic Mermaid debounce (larger files → 1–1.5s)
- [ ] Throttle scroll sync on large files — `scroll.ts`
- [ ] Longer auto-save debounce for files &gt; 1MB — `auto-save.ts`

## P2 — Enhancements

- [ ] Lazy-load syntax highlighter; virtualize huge code blocks; cache highlighted HTML; auto-collapse &gt; 100 lines
- [ ] Lazy / batch / cache KaTeX
- [ ] Mermaid: current-theme only pre-render; optional worker; diagram size warnings
- [ ] Virtualize large tables (rows ± columns); lazy when off-screen
- [ ] Image lazy-load (native), placeholders, size warnings

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

1. Virtual scroll + lazy viewport blocks  
2. Worker parse + incremental update  
3. Per-component opts (code / Mermaid / math / tables)  
4. Chunking / IndexedDB / metrics  
