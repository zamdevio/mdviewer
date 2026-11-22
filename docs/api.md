# API

Base URL: your Worker (e.g. `https://api.mdviewer.zamdev.dev`).

Interactive docs: **`/docs`** (Swagger UI)  
Machine-readable: **`/openapi.json`**

**Protocol:** `2` (Phase C — prefix layout, fixed TTL, optional password)

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | `{ ok: true }` |
| `GET` | `/compatibility` | Versioned handshake (`protocol: 2`) |
| `POST` | `/upload` | Create share; fair-use limited (IP+UA) |
| `GET` | `/share/:id` | Raw text; view-password if `viewProtected` |
| `GET` | `/share/:id/meta` | Anon meta (no content / no hash) |
| `PUT` | `/share/:id` | Replace content; **requires** `X-Share-Password`; keeps `expiresAt` |
| `PATCH` | `/share/:id` | `{ viewProtected }`; **requires** password |
| `DELETE` | `/share/:id` | Wipe prefix; **requires** password |

CORS / share URLs use `ALLOWED_ORIGINS` on the Worker.

### Upload headers (optional)

| Header | Meaning |
|--------|---------|
| `X-Share-Password` | Stored as PBKDF2 hash; required later for mutate |
| `X-Share-TTL-Seconds` | Fixed TTL (default **604800** / 7d, min **60**, max **30d**) |
| `X-Share-View-Protected` | `true` / `1` — GET needs password (ignored if no password) |
| `X-Share-Filename` | Object name under `shares/{id}/files/` |
| `X-Share-Type` | `file` (default) or `project` |

### Storage layout

```text
shares/{shareId}/metadata.json
shares/{shareId}/files/{filename}
```

Legacy flat keys (`{id}` only) remain readable via `GET` until removed; they have no TTL/password.

### TTL

`expiresAt` is set **once** at create. Content PUT does not slide it. Daily cron (`0 4 * * *`) deletes expired prefixes.

## Compatibility handshake

```json
{
  "name": "mdviewer-api",
  "version": "2.0.0",
  "protocol": 2,
  "features": {
    "password": true,
    "fixedTtl": true,
    "viewProtected": true,
    "fairUseFingerprint": true,
    "legacyFlatKeys": true
  },
  "ttl": {
    "defaultSeconds": 604800,
    "minSeconds": 60,
    "maxSeconds": 2592000
  },
  "cors": {
    "allowedOriginsConfigured": true
  }
}
```

- Bump **`protocol`** only on breaking API changes.
- Does **not** expose secret allowlist values — only whether origins are configured.

## Self-host

1. Deploy `apps/worker` with your R2 bucket + `ALLOWED_ORIGINS` ([`wrangler.jsonc`](../apps/worker/wrangler.jsonc))
2. Point the SPA at that worker via build env **or** Settings → Share
3. Call `/compatibility` from your client before relying on `/upload`
