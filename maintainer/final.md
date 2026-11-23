# Pre–v4.0 release checklist

Clear every section before bumping to **v4.0.0**. Until then ship **3.x.x** only.

Focus order: [`phases/focus.md`](./phases/focus.md).

**Rule:** deploy current `main` after this checklist is accepted; **only then** bump/tag **4.0.0** and redeploy. No v4 before that deploy.

---

## 1. Uncommitted / deploy debt

- [x] Commit hygiene + C–E + perf slices (local; push when ready)
- [x] Confirm no stale `apps/worker/wrangler.toml` (jsonc only)
- [x] Redeploy Pages (`markview`) and Worker (`mdviewer`) (CI on main; cron on Paid Workers)
- [x] Local smoke (`wrangler dev`): health, compatibility, llms*, MCP, upload/meta/PUT/DELETE
- [x] Prod smoke: `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml` (+ Worker `/health` `/compatibility` `/mcp`)
- [ ] Manual: `#heading` fragment links in editor split preview + `/share` — fixture: https://mdviewer.zamdev.dev/share/35668cac054792ba7ce8cc7ddb38b2fc (fork to editor or open share; click Contents links)
- [x] Confirm Worker `/favicon.svg` + MCP `serverInfo.icons` after favicon deploy (`b0d9ca2`)

## 2. Docs honesty

- [x] [`apps/web/public/llms-full.txt`](../apps/web/public/llms-full.txt) — protocol 3 + manage/view + MCP; Worker embeds generated copy
- [x] [`README.md`](../README.md) — manage token / view password / TTL / MCP listed as shipped where true
- [x] [`docs/api.md`](../docs/api.md) — protocol 3 + MCP
- [x] [`docs/security.md`](../docs/security.md) — manage vs view hardened
- [x] Root [`SECURITY.md`](../SECURITY.md) / [`CONTRIBUTING.md`](../CONTRIBUTING.md) present and linked

## 3. Phase C — share protocol

See [`shipped/01-share-protocol.md`](./shipped/01-share-protocol.md) (folded).

- [x] R2 prefix layout + `metadata.json`
- [x] Password hash; mutate/delete require manage token (protocol 3)
- [x] Optional `viewProtected` on GET
- [x] Fixed TTL (default 7d / max 30d) + cron sweep
- [x] Fair-use DO (IP+UA); stricter on agent-shaped traffic
- [x] Bump `/compatibility` protocol; update `docs/api.md` + systems worker doc
- [x] Redeploy Worker so protocol is live on prod

## 4. Phase D — unified share dialog

See [`shipped/02-share-dialog.md`](./shipped/02-share-dialog.md) (folded).

- [x] One Share dialog (editor + file + project)
- [x] Local `shareId` binding; new link vs replace
- [x] TTL picker + wipe time; protect-view toggle → Settings `#password`
- [x] Shares page remote DELETE with manage token

## 5. Phase E — agent surfaces

See [`shipped/03-agent-surfaces.md`](./shipped/03-agent-surfaces.md) (folded).

- [x] SPA `/llms.txt` + `/llms-full.txt`
- [x] Worker MCP tools on same service
- [x] Worker-hosted `/llms*` routes
- [x] Compatibility + `docs/api.md` when MCP ships
- [x] Redeploy Worker so `/mcp` + `/llms*` are live on prod
- [x] MCP brand icon live after `b0d9ca2` deploy

## 6. Perf (large docs)

See [`shipped/04-perf-large-docs.md`](./shipped/04-perf-large-docs.md) (folded; slices 0–3 shipped).

- [x] Size-aware preview / Mermaid debounce / lazy Mermaid / LRU / scroll throttle / auto-save scaling
- [x] Virtual scroll preview + chunked worker parse + lazy visible chunks
- [x] Slice 3 per-component (code/Mermaid/math/images)
- [x] **Honest claim for v4:** ~**2MB** virtualized preview is the practical bar we have evidence for (you’ve smoked ~1.8–2MB). Smoothness still depends on machine/CPU/RAM — editor textarea is **not** virtualized. **No 5–10MB claim.** Slice 4 (IndexedDB AST / table row virt / metrics) + editor virt = **parked post-v4**.
- Generate local stress files (optional): `node scripts/gen-large-md.mjs --mb 2` (also `--mb 5` if you want to feel the cliff; don’t advertise).

## 6b. Protocol 3 — manage token

See [`shipped/07-manage-token.md`](./shipped/07-manage-token.md) (folded).

- [x] Settings `#token`; rotate + confirm + bulk rotate
- [x] View password disposable per share; mutate uses Bearer manage token only
- [x] Already-shared UX; Shares Edit = editor dialog
- [x] Compatibility protocol 3 + llms + OpenAPI/MCP docs
- [x] Local + prod smoke — 2026-11-23
- [x] Wipe Worker R2 before protocol 3 smoke
- [x] **Appflare deferred until after v4** ([`phases/06-appflare.md`](./phases/06-appflare.md))

## 7. Loose ends (**Parked** — not v4 blockers)

- [ ] Nested projects — **Parked**
- [ ] CSP nonce over `unsafe-inline` theme bootstrap — **Parked**
- [ ] Settings portals → `ModalShell` where still open — **Parked**
- [x] Root + `@mdviewer/web` package versions stay in sync (3.x until bump)

## 8. Release gate

- [ ] §1 `#heading` smoke accepted by human
- [ ] Sections 1–7 accepted (deferred notes above) — **needs human + agent approval**
- [ ] Deploy current `main` (3.x) to prod and confirm green
- [ ] Bump root + `apps/web` to **4.0.0**; tag release — **only after that deploy**
- [ ] Update home / README “Now Available” to 4.0; refresh llms if needed
- [ ] Append row to [`shipped/README.md`](./shipped/README.md)
