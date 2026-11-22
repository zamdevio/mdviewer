# API

Base URL: your Worker (e.g. `https://api.mdviewer.zamdev.dev`).

Interactive docs: **`/docs`** (Swagger UI)  
Machine-readable: **`/openapi.json`**

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | `{ ok: true }` |
| `POST` | `/upload` | text/plain or multipart; rate limited |
| `GET` | `/share/:id` | raw text; unlimited |

CORS / share URLs use `ALLOWED_ORIGINS` on the Worker.
