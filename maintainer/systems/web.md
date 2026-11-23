# Web (`apps/web`)

- Entry: `src/main.tsx` → `app-shell/App.tsx`
- Router: `react-router-dom` routes for `/`, `/editor`, `/files`, `/search`, `/shares`, `/share`, `/settings`
- Theme: `next-themes` (works without Next)
- Local storage helpers: `src/lib/storage`
- Share client: `src/lib/api.ts` → Worker
- PWA: `src/pwa/sw.template.js` → Vite plugin emits `/sw.js` with `CACHE_VERSION` from `package.json`

## Share UX (protocol 3)

Dialog ([`../shipped/08-share-ux.md`](../shipped/08-share-ux.md) → compact polish):

| Surface | Role |
|---------|------|
| **ShareComposeDialog** | One sheet: bound link + Update/New/Delete + TTL/protect; success = toast + clipboard |
| **SharePanel** | Optional distribute sheet if clipboard fails / toolbar reopen |

Rules:

- Remote **DELETE 404** → treat as gone; prune local Shares row + clear `file`/`project` `shareId` (`lib/share/remote-delete.ts`). Do **not** delete Files/Editor body.
- Shares **Edit** Update only when a local file/project still has that `shareId`; else “open in Editor”.
- PUT does **not** slide `expiresAt` — Manage shows wipe time when known.

### Rotate **manage** token (Settings `#token`)

- `POST /share/rotate-manage` batched via `limits.rotateManageMaxIds`
- Results dialog: scrollable updated/failed rows + **View** per id (`RotateManageResultsDialog`)
- Persist new token if any id was re-keyed, or if failures are only `not_found`/`expired` (`lib/share/rotate-manage.ts`)
- Tombstones / unauthorized rows: optional local prune from results panel

Do not confuse with **rotate view password** (per-share PATCH in Compose).

## Markdown preview

- **&lt;100KB:** sync `MarkdownViewer` / `ReactMarkdown` (`components/markdown/viewer.tsx`)
- **≥100KB (`VIRTUALIZE_PREVIEW_BYTES`):** `VirtualMarkdownViewer` — h1/h2 `splitMarkdownChunks`, `@tanstack/react-virtual`
- **Worker parse (04 slice 2):** `lib/markdown/worker-parser.ts` + `parser.worker.ts` → **hast**; main renders via `HastDocument` (`hast-util-to-jsx-runtime` + shared `MarkdownComponents`)
- **Lazy parse:** plan/split immediately; parse first ~6 chunks + visible/overscan on scroll (`ensureChunkHasts`)
- **Incremental:** content-hash LRU (`chunk-cache.ts`, ~200) — unchanged chunk text reuses hast even if indices shift
- **Wide media:** `.markdown-table-scroll` + `pre` overflow-x so page width stays fixed
- **Perf badge:** `PreviewPerfBadge` in **expanded** editor tools (Theme → Virtualization → scroll/copy/share); also on `/share/:id` when gated — load tiers Sync→Critical
- **Slice 3 components:** code auto-collapse &gt;100 lines + IO before highlight; Mermaid current-theme only; skip math plugins when no delimiters; images `lazy`/`async` + size warn
- Fallback: if Worker fails, virtual path falls back to sync `MarkdownDocument` per chunk
- **Bound share:** `lib/share/bound-share.ts` resolves `SavedFile.shareId` or SharedLinks by filename so Manage survives reload
- **Share view helpers:** Copy markdown, scroll-to-top (after preview scrolled), Virtualization dialog (same badge)
- **Connection:** single shared `/health` probe — once on load, Recheck, `online`, retry only while unhealthy (no Connected spam)
- **Temp / Files editing:** empty or exact Settings default sample is *baseline* — not unsaved temp; does not trip Load warning; clears Files “Editing” mark on New / empty / no saved file
- **Load tiers (virt badge):** Sync → Light → Steady → Elevated (≥1MB) → Heavy (≥2MB / high heap) → Critical — ~1.8–2MB ⇒ Elevated is expected
- **Size honesty:** practical large-preview bar ~**2MB** (machine-dependent); editor textarea not virt; no 5–10MB claim; slice 4 parked post-v4 ([`../shipped/04-perf-large-docs.md`](../shipped/04-perf-large-docs.md))
- **Stress fixtures:** `node scripts/gen-large-md.mjs --mb 2` (local only)
