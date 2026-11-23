# Pre–v4.0 release checklist

Clear every section before bumping to **v4.0.0**. Until then ship **3.x.x** only.

Focus order: [`phases/focus.md`](./phases/focus.md).

---

## 1. Uncommitted / deploy debt

- [x] Commit hygiene + C–E + perf slices (local; push when ready)
- [x] Confirm no stale `apps/worker/wrangler.toml` (jsonc only)
- [x] Redeploy Pages (`markview`) and Worker (`mdviewer`) (CI on main; cron on Paid Workers)
- [x] Local smoke (`wrangler dev`): health, compatibility protocol 2, llms*, MCP tools/list+get_share, upload/meta/PUT/DELETE
- [x] Prod smoke: `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml` (+ Worker `/health` `/compatibility` `/mcp`)
- [ ] Manual: `#heading` fragment links in editor split preview + `/share`
- [x] Confirm Worker `/favicon.svg` + MCP `serverInfo.icons` after favicon deploy (`b0d9ca2`)

## 2. Docs honesty

- [x] [`apps/web/public/llms-full.txt`](../apps/web/public/llms-full.txt) — protocol 3 + manage/view + MCP; Worker embeds generated copy
- [x] [`README.md`](../README.md) — manage token / view password / TTL / MCP listed as shipped where true
- [x] [`docs/api.md`](../docs/api.md) — protocol 3 + MCP
- [x] [`docs/security.md`](../docs/security.md) — manage vs view hardened
- [x] Root [`SECURITY.md`](../SECURITY.md) / [`CONTRIBUTING.md`](../CONTRIBUTING.md) present and linked

## 3. Phase C — share protocol

See [`phases/01-share-protocol.md`](./phases/01-share-protocol.md).

- [x] R2 prefix layout + `metadata.json`
- [x] Password hash; mutate/delete require `X-Share-Password`
- [x] Optional `viewProtected` on GET
- [x] Fixed TTL (default 7d / max 30d) + cron sweep
- [x] Fair-use DO (IP+UA); stricter on agent-shaped traffic
- [x] Bump `/compatibility` protocol; update `docs/api.md` + systems worker doc
- [x] Redeploy Worker so protocol 2 is live on prod

## 4. Phase D — unified share dialog

See [`phases/02-share-dialog.md`](./phases/02-share-dialog.md).

- [x] One Share dialog (editor + file + project)
- [x] Local `shareId` binding; new link vs replace
- [x] TTL picker + wipe time; protect-view toggle → Settings `#password`
- [x] Shares page remote DELETE with password

## 5. Phase E — agent surfaces

See [`phases/03-agent-surfaces.md`](./phases/03-agent-surfaces.md).

- [x] SPA `/llms.txt` + `/llms-full.txt` (done in 3.x)
- [x] Worker MCP tools on same service (`get_share`, `upload_share`, …)
- [x] Worker-hosted `/llms*` routes
- [x] Compatibility + `docs/api.md` when MCP ships
- [x] Redeploy Worker so `/mcp` + `/llms*` are live on prod
- [x] MCP brand icon (`/favicon.svg` + SEP-973 `serverInfo.icons`) live after `b0d9ca2` deploy

## 6. Perf (large docs)

See [`phases/04-perf-large-docs.md`](./phases/04-perf-large-docs.md).

- [x] Size-aware preview / Mermaid debounce / lazy Mermaid / LRU / scroll throttle / auto-save scaling
- [x] Virtual scroll preview + chunked worker parse + lazy visible chunks (04 slices 1–2 + polish)
- [ ] **Still before a 5–10MB claim:** slice 3–4 leftovers / editor virt deferred — do not advertise full 5–10MB readiness until cleared or explicitly deferred in release notes

## 6b. Protocol 3 — manage token (**Now**)

See [`phases/07-manage-token.md`](./phases/07-manage-token.md) · order in [`phases/focus.md`](./phases/focus.md) · systems [`systems/worker.md`](./systems/worker.md) (protocol 3 only; no dual auth).

- [x] Settings `#token` (auto-gen; required to share; rotate + confirm + bulk rotate)
- [x] View password disposable per share; mutate uses Bearer manage token only
- [x] Already-shared UX core; Shares page Edit = editor dialog
- [x] Compatibility protocol 3 + llms + OpenAPI/MCP docs
- [x] Local + prod smoke (health / compatibility 3 / upload+mutate with manage token / view protect GET / rotate / delete) — 2026-11-23 after protocol 3 deploy
- [x] **Wipe Worker R2** share objects before protocol 3 smoke (list empty via Worker binding + API; bucket info metrics may lag)
- [ ] Appflare **Then** ([`phases/06-appflare.md`](./phases/06-appflare.md)) — declared; catalog describes protocol 3 once live

## 7. Loose ends (**Parked**)

- [ ] Nested projects — **Parked** (optional follow-up; not a v4 blocker unless we advertise it)
- [ ] CSP: prefer nonce over `script-src 'unsafe-inline'` for theme bootstrap — **Parked**
- [ ] Settings portals → `ModalShell` migration where still open — **Parked**
- [x] Root + `@mdviewer/web` package versions stay in sync (3.x line)

## 8. Release gate

- [ ] Sections 1–7 accepted (or explicitly deferred with notes) — **needs human + agent approval**
- [ ] Bump root + `apps/web` to **4.0.0**; tag release — **blocked until approval**
- [ ] Update home / README “Now Available” to 4.0; refresh llms briefs for new protocol
- [ ] Append row to [`shipped/README.md`](./shipped/README.md)
