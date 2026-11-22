# Worker (`apps/worker`)

- Framework: Hono `OpenAPIHono`
- Config: [`wrangler.jsonc`](../../apps/worker/wrangler.jsonc)
- Routes:
  - `POST /upload` — create under `shares/{id}/` + metadata; fair-use DO
  - `GET /share/:id` — content (legacy flat key fallback)
  - `GET /share/:id/meta` — anon meta
  - `PUT|PATCH|DELETE /share/:id` — password-gated mutate
  - `POST /mcp` — MCP JSON-RPC tools (same share store); `initialize.serverInfo.icons` (PNG data URI + `/favicon.png` + SVG)
  - `GET /favicon.svg`, `GET /favicon.png` — brand for MCP / browsers
  - `GET /llms.txt`, `GET /llms-full.txt` — agent briefs
  - `GET /health`, `GET /compatibility` (protocol **2**, `features.mcp`)

**MCP icons in Cursor:** server emits valid SEP-973 `icons[]`; Cursor’s Customize → MCPs list often still shows a generic puzzle glyph for user-added remote servers (staff-confirmed client gap). Marketplace plugins (e.g. tldraw) get icons from plugin metadata, not `serverInfo.icons`.
- Docs: `GET /docs`, `GET /openapi.json`
- CORS from `ALLOWED_ORIGINS` (includes share password / TTL headers)
- Fair-use Durable Object: `RateLimiter` keyed by IP+UA (+ CF country); stricter for agent-shaped UA / `X-MDViewer-Client: mcp`
- R2: `shares/{id}/metadata.json` + `shares/{id}/files/...`
- Cron: `0 4 * * *` → sweep expired shares
- Password: PBKDF2-SHA256 hash in metadata only
