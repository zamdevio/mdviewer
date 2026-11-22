# Phase E — Agent surfaces

**Status:** Queued  
**Depends on:** Phase C (protocol); preferably after D

## Goals

Discoverable API for agents without accounts.

## Surfaces

- `GET /llms.txt` — short product + API summary (public)
- `GET /llms-full.txt` — fuller endpoints + password/TTL semantics (public)
- MCP route on worker: `get_share`, `upload_share`, `update_share`, `delete_share`, `get_share_meta`
- Stricter fair-use on MCP / agent-shaped traffic

## Checklist

- [x] `llms.txt` + `llms-full.txt` on SPA (`apps/web/public/`) — agent discoverability / SEO
- [ ] Worker-hosted `/llms.txt` routes (optional; SPA copy is live)
- [ ] MCP tools + docs (needs Phase C auth/TTL/fair-use first)
- [ ] Compatibility + `docs/api.md` when MCP ships
- [x] README note for agents (points at llms files; MCP still queued)
