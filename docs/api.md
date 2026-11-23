# API

Base URL: your Worker (e.g. `https://api.mdviewer.zamdev.dev`).

Interactive docs: **`/docs`** (Swagger UI)  
Machine-readable: **`/openapi.json`**

**Protocol:** `3` — manage token for create/mutate; optional disposable view password for GET; fixed TTL; caps via `/compatibility`.

Share ids are **32-char lowercase hex** (128-bit). SPA, curl, and MCP use the **same** manage/view rules — no privileged agent path.

## Auth

| Concern | Header |
|---------|--------|
| Manage (upload / PUT / PATCH / DELETE / rotate) | `Authorization: Bearer <manageToken>` (preferred) or `X-Share-Manage-Token` |
| View (GET when `viewProtected`) | `X-Share-Password` **only** |

Do **not** use the view password as an admin secret.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | `{ ok: true }` |
| `GET` | `/compatibility` | Handshake (`protocol: 3`) + `ttl` + `limits` |
| `POST` | `/upload` | Create share; **manage token required**; fair-use (IP+UA) |
| `GET` | `/share/:id` | Raw text; view password if `viewProtected` |
| `GET` | `/share/:id/meta` | Anon meta (no content / no hashes) |
| `PUT` | `/share/:id` | Replace content; **manage token**; keeps `expiresAt` |
| `PATCH` | `/share/:id` | `{ viewProtected, viewPassword? }`; **manage token** |
| `DELETE` | `/share/:id` | Wipe prefix; **manage token** |
| `POST` | `/share/rotate-manage` | Bulk re-key manage hashes; Bearer **old** token; body `{ shareIds, newManageToken }` |
| `POST` | `/mcp` | MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`) |
| `GET` | `/mcp` | Discovery JSON (tool names) |
| `GET` | `/llms.txt` | Agent brief |
| `GET` | `/llms-full.txt` | Full agent brief |

CORS / share URLs use `ALLOWED_ORIGINS` on the Worker (include `Authorization` + manage/view headers).

### MCP tools

`get_share`, `get_share_meta`, `upload_share`, `update_share`, `delete_share` — mutating tools take **`manageToken`**; `get_share` takes **`viewPassword`** when protected. Fair-use is stricter for MCP (`X-MDViewer-Client: mcp`).

### Create / manage headers

| Header | Meaning |
|--------|---------|
| `Authorization: Bearer …` / `X-Share-Manage-Token` | **Required** on create and mutate |
| `X-Share-Password` | Optional view password at create (when protect on); GET-only afterward |
| `X-Share-TTL-Seconds` | Fixed TTL (default **604800** / 7d, min **60**, max **30d** — see `config.ts` / compatibility) |
| `X-Share-View-Protected` | `true` / `1` — GET needs view password (ignored if no view password) |
| `X-Share-Filename` | Object name under `shares/{id}/files/` |
| `X-Share-Type` | `file` (default) or `project` |

### Storage layout

```text
shares/{shareId}/metadata.json
shares/{shareId}/files/{filename}
```

Metadata includes `manageTokenHash` (required) and optional view `passwordHash`. Protocol **3** only.

### TTL

`expiresAt` is set **once** at create. Content PUT does not slide it. Daily cron (`0 4 * * *`) deletes expired prefixes.

### Bulk rotate

`POST /share/rotate-manage` with Bearer **old** manage token and JSON `{ "shareIds": [...], "newManageToken": "..." }`.  
Hashes the new token **once**, writes metadata only, returns `{ updated, failed }`. Cap: `limits.rotateManageMaxIds` (default **50**).

Failure codes per id: `not_found`, `expired`, `unauthorized`. SPA Settings shows a scrollable results panel (View per id). It **persists** the new manage token when any id was re-keyed (those hashes already expect the new secret), or when failures are only tombstones; otherwise it keeps the previous token. Local Shares rows for gone/orphan ids can be pruned from that panel.

**SPA Share UX:** Manage (bound link) → Compose (TTL / view protect) → Distribute (success sheet with Back). Content update = `PUT` (does not slide TTL). View password = `PATCH`. Delete = `DELETE`; HTTP **404** is treated as already gone and the SPA still clears its local binding.

## Compatibility handshake

```json
{
  "name": "mdviewer",
  "version": "3.0.0",
  "protocol": 3,
  "features": {
    "manageToken": true,
    "viewPasswordSeparate": true,
    "fixedTtl": true,
    "viewProtected": true,
    "fairUseFingerprint": true,
    "mcp": true,
    "llmsTxt": true
  },
  "ttl": {
    "defaultSeconds": 604800,
    "minSeconds": 60,
    "maxSeconds": 2592000
  },
  "limits": {
    "maxFileBytes": 5242880,
    "rotateManageMaxIds": 50
  },
  "cors": {
    "allowedOriginsConfigured": true
  }
}
```

- Bump **`protocol`** only on breaking API changes.
- SPA/BYO clients should adapt TTL UI and rotate batch size from `ttl` / `limits` — do not hardcode.
- Does **not** expose secret allowlist values — only whether origins are configured.

## Self-host

1. Deploy `apps/worker` with your R2 bucket + `ALLOWED_ORIGINS` ([`wrangler.jsonc`](../apps/worker/wrangler.jsonc))
2. Tune caps in [`apps/worker/src/lib/config.ts`](../apps/worker/src/lib/config.ts), redeploy
3. Point the SPA at that worker via build env **or** Settings → Share; call `/compatibility` before relying on `/upload`
4. Set a **manage token** in Settings → Manage token (`#token`) before sharing
