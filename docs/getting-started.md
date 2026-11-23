# Getting started

## Requirements

- Node 20+
- pnpm (repo pins `packageManager` in root `package.json`)

## Install

```bash
pnpm install
```

Copy env:

```bash
cp .env.example .env.local
```

Set `VITE_API_URL` and `VITE_FRONTEND_URL` for build-time defaults.

## Dev

```bash
# SPA (http://localhost:3000)
pnpm web:dev

# Worker API (wrangler)
pnpm worker:dev
```

- Swagger UI (worker): `/docs`
- OpenAPI JSON: `/openapi.json`
- Compatibility handshake: `/compatibility`

## Share API in the browser

You can override the share worker **without rebuilding**:

1. Open **Settings → Share** (or `/settings#share`)
2. Set **Worker API URL** and **Frontend URL**
3. **Save**, then **Test connection** (`/health` + `/compatibility`)
4. **Default** restores build-time env after a confirmation dialog

Build-time `VITE_*` values remain the fallback when no override is stored.

## Manage token (protocol 3)

Sharing requires a **manage token** (Settings → Manage token, `/settings#token`). The SPA auto-generates one; you can rotate it (bulk re-key for local share ids, batch size from `/compatibility`).

| Secret | Used for |
|--------|----------|
| Manage token | Create / update / protect toggle / delete |
| View password | Optional per-share GET protect (disposable; never authorizes mutate) |

## Agents: MCP + llms.txt

Same share rules as the SPA — no privileged agent path.

| Surface | Where |
|---------|--------|
| Agent brief | SPA `/llms.txt` · `/llms-full.txt` (Worker mirrors these) |
| MCP | Worker `POST /mcp` (tools: `upload_share`, `get_share`, `get_share_meta`, `update_share`, `delete_share`) |
| Discovery | `GET /mcp` |

Mutating MCP tools take `manageToken`; view-protected `get_share` takes `viewPassword`. Prefer reading `/llms.txt` then `/llms-full.txt` before calling tools. Details: [`api.md`](./api.md).

## Files: grid vs tree

On **Files**, toggle **Grid** / **Tree**. Preference is saved in settings (`filesLayout`).

**Tree mode**
- Virtual **projects** group files (drag onto a project / Ungrouped)
- Right-click or ⋮ for rename, share, details, move, delete
- Move-to-project uses a searchable picker
- Share a project as a pack (`MDVIEWER_PROJECT_V1`) via the same `/upload` API — open the share link to import

**Import / export**
- Projects merge by name; files with identical content fingerprints are skipped as duplicates

**Trash**
- Settings → Trash (default on): deleted files/projects soft-delete and can be restored. Turn off for permanent delete after confirm.

## Local CORS

For share from `http://localhost:3000`, ensure that origin is listed in `ALLOWED_ORIGINS` in [`apps/worker/wrangler.jsonc`](../apps/worker/wrangler.jsonc) and redeploy the worker.
