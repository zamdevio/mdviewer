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

- [ ] llms.txt + llms-full.txt routes
- [ ] MCP tools + docs
- [ ] Compatibility + `docs/api.md`
- [ ] README note for agents
