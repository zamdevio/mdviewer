# Shipped

Closed slices (newest first). Full folded phase receipts live beside this index (`01`–`03`, `05`, `07`, `08`). Open work stays in [`../phases/`](../phases/) (`focus`, `04`, `06` only).

| When | Slice | Notes |
|------|-------|-------|
| 2026-11 | Fold phases 01–03 / 05 / 07 / 08 → `shipped/` | `phases/` stubs only; Focus lists open docs |
| 2026-11 | Editor baseline / Files editing mark | Default sample + empty ≠ unsaved; clear Files “Editing” when New/empty/temp baseline |
| 2026-11 | Perf slice 3 per-component | Code collapse/lazy HL; Mermaid current-theme + size warn; skip-math pipeline; image lazy/async + size warn; table row virt deferred to 4 |
| 2026-11 | Share view helpers | `/share/:id` Virtualization badge, Copy markdown, gated scroll-up |
| 2026-11 | Share bind + compact UX + preview polish | Bound share survives reload; one Share dialog; table/code overflow-x; virt badge; lazy visible worker parse; health probe de-spam |
| 2026-11 | Perf slice 2 worker hast parse | `worker-parser` + Vite module worker → hast; content-hash LRU; `HastDocument` on virtual preview/share; &lt;100KB sync unchanged |
| 2026-11 | Share UX 08 | Manage→compose→distribute; DELETE 404→local prune; rotate-manage results panel + safe token persist; docs/systems |
| 2026-11 | Preview virt + showcase visibility + `mdviewer` naming | Virtualized preview/share ≥100KB; home agent band; MCP/compat/`wrangler` name `mdviewer` (Pages `markview`); editor virt deferred |
| 2026-11 | Showcase honesty + hex share ids | Protocol 3 honesty on README/home/docs; share ids lowercase hex (double-click copy) |
| 2026-11 | Protocol 3 manage token | Worker Bearer manage + view-only password; rotate-manage; SPA `#token`; Shares Edit; llms/docs; prod smoke + R2 clear |
| 2026-11 | knip + madge + vitest | Root knip/madge; worker+web vitest for TTL/password/fair-use/debounce |
| 2026-11 | llms generate + perf slice 2 | SPA→worker llms generator; lazy Mermaid/LRU/throttle/autosave |
| 2026-11 | Phase E MCP + worker llms | `POST /mcp` tools; worker `/llms.txt` + `/llms-full.txt`; compatibility `features.mcp` |
| 2026-11 | Phase D unified share dialog | ShareComposeDialog; Settings `#password`; shareId bind; replace vs new; Shares remote DELETE; view-password unlock |
| 2026-11 | Phase C share protocol | R2 `shares/{id}/`; password PBKDF2; fixed TTL + cron; fair-use IP+UA; PUT/PATCH/DELETE/meta; compatibility **protocol 2** |
| 2026-11 | Repo hygiene + phase fold | LICENSE/SECURITY/CONTRIBUTING/CoC; `final.md` pre-v4.0; fold A/B/UI/platform; phases `01`–`04`; web+root **3.5.0** |
| 2026-11 | wrangler.jsonc + llms/SEO + #heading anchors | Worker config → jsonc; llms.txt / llms-full.txt / robots / sitemap; OG meta; fragment links in editor+share preview |
| 2026-11 | Phase A + B (folded) | SW/dialogs/home (A); lean trash (B) — phase files removed; details in older rows below |
| 2026-11 | Security harden + Files import + UX polish | Mermaid strict; sanitize after KaTeX; CSP/COOP; http(s) API override; docs/security.md; trash confirm/restore-all; Connected badge; Files Import |
| 2026-11 | Phase B lean trash | Soft-delete files/projects; Settings toggle + restore/purge; export excludes trash |
| 2026-11 | Phase A UX polish | SW network-first assets + auto-activate; ModalShell backdrop/X; ConfirmDeleteDialog; home hero; README/docs showcase; web 3.3.0 |
| 2026-11 | Tree DnD + project pack + Vite defaults | DnD/context menus/ProjectPicker; MDVIEWER_PROJECT_V1; import fingerprint merge; public URL fallbacks |
| 2026-11 | Files tree + BYO share + badge dialogs | Virtual projects; grid/tree; Settings `#share`; `/compatibility`; connection ModalShells; README/docs |
| 2026-11 | CORS UX + CF Actions | CORS vs API-down detection; share CORS dialog; localhost allowlist; GH→CF deploy; PWA cache migration rule |
| 2026-11 | UI polish slice 5 | Shared `ModalShell` (focus trap/restore); shares list density; API-gated share load + quieter API warning |
| 2026-11 | UI polish slices 2–4 | Mobile editor chrome; files/shares/search empty states; settings grouping + save toast |
| 2026-11 | UI polish slice 1 | Quieter home hero/CTA; nav active states; connection “Share off”; footer/mobile; wider editor shell |
| 2026-11 | Monorepo reshape | Next → Vite `apps/web`; workers-api → Hono OpenAPI `apps/worker`; added `maintainer/` |
