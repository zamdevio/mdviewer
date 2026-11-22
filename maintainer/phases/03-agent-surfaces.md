# Phase E — Agent surfaces

**Order:** 03  
**Status:** Shipped  
**Depends on:** Phase C ([`01-share-protocol.md`](./01-share-protocol.md)); preferably after D ([`02-share-dialog.md`](./02-share-dialog.md))

## Goals

Discoverable API for agents without accounts.

## Surfaces

- `GET /llms.txt` — short product + API summary (public)
- `GET /llms-full.txt` — fuller endpoints + password/TTL semantics (public)
- MCP route on worker: `get_share`, `upload_share`, `update_share`, `delete_share`, `get_share_meta`
- Stricter fair-use on MCP / agent-shaped traffic

## Checklist

- [x] `llms.txt` + `llms-full.txt` on SPA (`apps/web/public/`) — agent discoverability / SEO
- [x] Worker-hosted `/llms.txt` + `/llms-full.txt` routes
- [x] MCP tools + docs (`POST /mcp` JSON-RPC)
- [x] Compatibility + `docs/api.md` when MCP ships
- [x] README note for agents
