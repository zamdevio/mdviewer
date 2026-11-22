/** Worker-hosted agent briefs (kept in sync with SPA public copies). */

export const LLMS_TXT = `# MDViewer

> Offline-first Markdown studio — edit, organize, preview, and optionally share via Cloudflare Workers. Private by default.

MDViewer is a client-side Markdown app (Vite + React) with an optional edge share API (Hono on Cloudflare Workers + R2). Core writing stays in the browser; no account required for local use.

## Docs

- [Getting started](https://github.com/zamdevio/mdviewer/blob/main/docs/getting-started.md): install and run
- [API](https://github.com/zamdevio/mdviewer/blob/main/docs/api.md): Worker endpoints (protocol 2)
- [Security](https://github.com/zamdevio/mdviewer/blob/main/docs/security.md): threat model and mitigations
- [Full agent brief](https://api.mdviewer.zamdev.dev/llms-full.txt): endpoints, password/TTL, MCP

## App

- [Home](https://mdviewer.zamdev.dev/): product entry
- [Editor](https://mdviewer.zamdev.dev/editor): write + live preview
- [API docs (Swagger)](https://api.mdviewer.zamdev.dev/docs): OpenAPI UI
- [MCP](https://api.mdviewer.zamdev.dev/mcp): JSON-RPC tools (POST)
- [Source](https://github.com/zamdevio/mdviewer): GitHub
`;

export const LLMS_FULL_TXT = `# MDViewer — full agent brief (Worker)

> Protocol 2 share API + MCP tools on the same Worker. SPA also hosts /llms.txt for SEO.

## Worker API

Base: this host (e.g. https://api.mdviewer.zamdev.dev)

| Method | Path | Notes |
|--------|------|-------|
| GET | /health | Liveness |
| GET | /compatibility | protocol 2 + features.mcp |
| POST | /upload | Create share; fair-use; optional X-Share-* headers |
| GET | /share/:id | Content; password if viewProtected |
| GET | /share/:id/meta | Anon meta |
| PUT | /share/:id | Replace; X-Share-Password |
| PATCH | /share/:id | viewProtected; password |
| DELETE | /share/:id | Wipe; password |
| POST | /mcp | MCP JSON-RPC (initialize, tools/list, tools/call) |
| GET | /llms.txt | This short brief’s sibling |
| GET | /llms-full.txt | This file |
| GET | /docs | Swagger UI |

Upload headers: X-Share-Password, X-Share-TTL-Seconds (default 7d, max 30d), X-Share-View-Protected, X-Share-Filename, X-Share-Type.

## MCP tools

POST /mcp with JSON-RPC 2.0. Tools: get_share, get_share_meta, upload_share, update_share, delete_share.

Mutating tools require password arguments. Fair-use is stricter for MCP / agent-shaped clients (set User-Agent or X-MDViewer-Client: mcp).

## Security

- Preview sanitization + Mermaid strict on the SPA
- Password hashes PBKDF2; never returned from meta
- Details: https://github.com/zamdevio/mdviewer/blob/main/docs/security.md
`;
