# Shipped

Closed slices (newest first).

| When | Slice | Notes |
|------|-------|-------|
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
