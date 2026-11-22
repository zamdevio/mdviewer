# Getting started

## Requirements

- Node 20+
- pnpm 9+ (repo pins `packageManager`)

## Install

```bash
pnpm install
```

Copy env:

```bash
cp .env.example .env.local
```

Set `VITE_API_URL` and `VITE_FRONTEND_URL`.

## Dev

```bash
# SPA (http://localhost:3000)
pnpm web:dev

# Worker API (wrangler)
pnpm worker:dev
```

Swagger UI (when worker is running): `/docs`  
OpenAPI JSON: `/openapi.json`
