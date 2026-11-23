# Worker (`apps/worker`)

- Framework: Hono `OpenAPIHono`
- Config: [`wrangler.jsonc`](../../apps/worker/wrangler.jsonc)
- **Tunable caps:** `src/lib/config.ts` (TTL bounds, max file bytes, rotate-manage max ids, fair-use defaults). Self-host: edit + redeploy; SPA adapts via `GET /compatibility` `ttl` / `limits`. Env `RATE_LIMIT_*` still overrides fair-use window/max.
- Routes (target **protocol 3** — [`../phases/07-manage-token.md`](../phases/07-manage-token.md)):
  - `POST /upload` — create under `shares/{id}/` + metadata; **manage token required**; optional view password if protect on; fair-use DO
  - `GET /share/:id` — content; `X-Share-Password` only if `viewProtected`
  - `GET /share/:id/meta` — anon meta (no hashes)
  - `PUT|PATCH|DELETE /share/:id` — **Bearer / X-Share-Manage-Token** only
  - `POST /share/rotate-manage` — bulk re-key `manageTokenHash` (hash once, parallel meta, cap from config)
  - `POST /mcp` — MCP JSON-RPC tools (same share store; manageToken for mutate/upload); `initialize.serverInfo.icons` (PNG data URI + `/favicon.png` + SVG)
  - `GET /favicon.svg`, `GET /favicon.png` — brand for MCP / browsers
  - `GET /llms.txt`, `GET /llms-full.txt` — agent briefs
  - `GET /health`, `GET /compatibility` (`protocol: 3`, features + `ttl` + `limits`)

**Until Slice A ships:** prod may still speak protocol 2 (password-gated mutate, flat-key GET fallback). Do not document dual auth as a product promise — hard cut in 07.

**MCP icons in Cursor:** server emits valid SEP-973 `icons[]`; Cursor’s Customize → MCPs list often still shows a generic puzzle glyph for user-added remote servers (staff-confirmed client gap). Marketplace plugins (e.g. tldraw) get icons from plugin metadata, not `serverInfo.icons`.
- Docs: `GET /docs`, `GET /openapi.json`
- CORS from `ALLOWED_ORIGINS` (include `Authorization`, manage + view password / TTL headers)
- Fair-use Durable Object: `RateLimiter` keyed by IP+UA (+ CF country); stricter for agent-shaped UA / `X-MDViewer-Client: mcp`
- R2: `shares/{id}/metadata.json` + `shares/{id}/files/...` — `manageTokenHash` required; `passwordHash` view-only optional
- Cron: `0 4 * * *` → sweep expired shares
- Secrets: PBKDF2-SHA256 hashes in metadata only; never in public responses
- Pre-v4 ops: wipe R2 before real v4 deploy ([`../final.md`](../final.md))
