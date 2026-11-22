# Pre–v4.0 release checklist

Clear every section before bumping to **v4.0.0**. Until then ship **3.x.x** only.

Focus order: [`phases/focus.md`](./phases/focus.md).

---

## 1. Uncommitted / deploy debt

- [x] Commit hygiene + C–E + perf slices (local; push when ready)
- [x] Confirm no stale `apps/worker/wrangler.toml` (jsonc only)
- [ ] Redeploy Pages (`markview`) and Worker (`mdviewer-api`)
- [ ] Smoke: `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml` on prod
- [ ] Smoke: `#heading` fragment links in editor split preview + `/share`

## 2. Docs honesty

- [x] [`apps/web/public/llms-full.txt`](../apps/web/public/llms-full.txt) — protocol 2 + MCP documented; Worker embeds generated copy
- [x] [`README.md`](../README.md) — password/TTL/MCP listed as shipped where true
- [x] [`docs/api.md`](../docs/api.md) — protocol 2 + MCP
- [x] [`docs/security.md`](../docs/security.md) — Phase C rows marked hardened
- [x] Root [`SECURITY.md`](../SECURITY.md) / [`CONTRIBUTING.md`](../CONTRIBUTING.md) present and linked

## 3. Phase C — share protocol

See [`phases/01-share-protocol.md`](./phases/01-share-protocol.md).

- [x] R2 prefix layout + `metadata.json`
- [x] Password hash; mutate/delete require `X-Share-Password`
- [x] Optional `viewProtected` on GET
- [x] Fixed TTL (default 7d / max 30d) + cron sweep
- [x] Fair-use DO (IP+UA); stricter on agent-shaped traffic
- [x] Bump `/compatibility` protocol; update `docs/api.md` + systems worker doc
- [ ] Redeploy Worker so protocol 2 is live on prod

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
- [ ] Redeploy Worker so `/mcp` + `/llms*` are live on prod

## 6. Perf (large docs)

See [`phases/04-perf-large-docs.md`](./phases/04-perf-large-docs.md).

- [x] Size-aware preview / Mermaid debounce / lazy Mermaid / LRU / scroll throttle / auto-save scaling
- [ ] **Deferred for v4 claim:** virtual scroll preview + chunked worker parse (do not claim 5–10MB readiness until done — or note deferred in release notes)

## 7. Loose ends

- [ ] Nested projects — **deferred** (optional follow-up; not a v4 blocker unless we advertise it)
- [ ] CSP: prefer nonce over `script-src 'unsafe-inline'` for theme bootstrap — **deferred**
- [ ] Settings portals → `ModalShell` migration where still open — **deferred**
- [x] Root + `@mdviewer/web` package versions stay in sync (3.x line)

## 8. Release gate

- [ ] Sections 1–7 accepted (or explicitly deferred with notes) — **needs human + agent approval**
- [ ] Bump root + `apps/web` to **4.0.0**; tag release — **blocked until approval**
- [ ] Update home / README “Now Available” to 4.0; refresh llms briefs for new protocol
- [ ] Append row to [`shipped/README.md`](./shipped/README.md)
