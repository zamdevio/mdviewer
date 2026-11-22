# API

Base URL: your Worker (e.g. `https://api.mdviewer.zamdev.dev`).

Interactive docs: **`/docs`** (Swagger UI)  
Machine-readable: **`/openapi.json`**

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | `{ ok: true }` |
| `GET` | `/compatibility` | Versioned handshake for BYO frontends |
| `POST` | `/upload` | text/plain or multipart; rate limited |
| `GET` | `/share/:id` | raw text; unlimited |

CORS / share URLs use `ALLOWED_ORIGINS` on the Worker.

## Compatibility handshake

`GET /compatibility` returns a stable JSON contract so a custom SPA (or Settings → Test connection) can verify the backend speaks MDViewer share protocol:

```json
{
  "name": "mdviewer-api",
  "version": "1.0.0",
  "protocol": 1,
  "endpoints": [
    { "method": "GET", "path": "/health" },
    { "method": "GET", "path": "/compatibility" },
    { "method": "POST", "path": "/upload" },
    { "method": "GET", "path": "/share/:id" }
  ],
  "cors": {
    "allowedOriginsConfigured": true
  }
}
```

- Bump **`protocol`** only on breaking API changes.
- Does **not** expose secret allowlist values — only whether origins are configured.

## Self-host

1. Deploy `apps/worker` with your R2 bucket + `ALLOWED_ORIGINS`
2. Point the SPA at that worker via build env **or** Settings → Share
3. Call `/compatibility` from your client before relying on `/upload`
