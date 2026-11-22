# Pre–v4.0 release checklist

Clear every section before bumping to **v4.0.0**. Until then ship **3.x.x** only.

Focus order: [`phases/focus.md`](./phases/focus.md).

---

## 1. Uncommitted / deploy debt

- [ ] Commit + push wrangler.jsonc + llms/SEO/`#heading` slice (if still local)
- [ ] Confirm no stale `apps/worker/wrangler.toml` (use `wrangler.jsonc` only)
- [ ] Redeploy Pages (`markview`) and Worker (`mdviewer-api`) after that slice
- [ ] Smoke: `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml` on prod
- [ ] Smoke: `#heading` fragment links in editor split preview + `/share`

## 2. Docs honesty

- [ ] [`apps/web/public/llms-full.txt`](../apps/web/public/llms-full.txt) — only protocol-1 endpoints claimed; C/E marked not available
- [ ] [`README.md`](../README.md) — no password/TTL/MCP as shipped
- [ ] [`docs/api.md`](../docs/api.md) — matches live Worker until protocol bump
- [ ] [`docs/security.md`](../docs/security.md) — queued rows still point at Phase C doc
- [ ] Root [`SECURITY.md`](../SECURITY.md) / [`CONTRIBUTING.md`](../CONTRIBUTING.md) present and linked

## 3. Phase C — share protocol

See [`phases/01-share-protocol.md`](./phases/01-share-protocol.md).

- [ ] R2 prefix layout + `metadata.json`
- [ ] Password hash; mutate/delete require `X-Share-Password`
- [ ] Optional `viewProtected` on GET
- [ ] Fixed TTL (default 7d / max 30d) + cron sweep
- [ ] Fair-use DO (IP+UA); stricter on agent-shaped traffic
- [ ] Bump `/compatibility` protocol; update `docs/api.md` + systems worker doc

## 4. Phase D — unified share dialog

See [`phases/02-share-dialog.md`](./phases/02-share-dialog.md).

- [ ] One Share dialog (editor + file + project)
- [ ] Local `shareId` binding; new link vs replace
- [ ] TTL picker + wipe time; protect-view toggle → Settings `#password`
- [ ] Shares page remote DELETE with password

## 5. Phase E — agent surfaces

See [`phases/03-agent-surfaces.md`](./phases/03-agent-surfaces.md).

- [x] SPA `/llms.txt` + `/llms-full.txt` (done in 3.x)
- [ ] Worker MCP tools on same service (`get_share`, `upload_share`, …)
- [ ] Optional worker-hosted `/llms*` routes
- [ ] Compatibility + `docs/api.md` when MCP ships

## 6. Perf (large docs)

See [`phases/04-perf-large-docs.md`](./phases/04-perf-large-docs.md).

- [ ] P1 virtual scroll + lazy heavy blocks (minimum bar for v4 if we claim large-doc readiness; else defer explicitly in release notes)

## 7. Loose ends

- [ ] Nested projects (optional; was follow-up on files tree)
- [ ] CSP: prefer nonce over `script-src 'unsafe-inline'` for theme bootstrap
- [ ] Settings portals → `ModalShell` migration where still open
- [ ] Root + `@mdviewer/web` package versions stay in sync

## 8. Release gate

- [ ] Sections 1–7 accepted (or explicitly deferred with notes)
- [ ] Bump root + `apps/web` to **4.0.0**; tag release
- [ ] Update home / README “Now Available” to 4.0; refresh llms briefs for new protocol
- [ ] Append row to [`shipped/README.md`](./shipped/README.md)
