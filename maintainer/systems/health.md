# Repo health tooling

## vitest

```bash
pnpm test           # all workspaces
pnpm worker:test    # password / TTL / fair-use / paths
pnpm web:test       # preview debounce helpers
```

Colocated `*.test.ts` next to the module under test (`ttl.test.ts` ↔ `ttl.ts`). Expand as routes grow.

## knip

```bash
pnpm knip
```

Config: [`knip.json`](../../knip.json). Should exit clean (unused deps/exports trimmed; barrels only re-export what pages/hooks import).

## madge

```bash
pnpm madge:circular   # fail on cycles
pnpm madge:orphans
pnpm madge:leaves
```

No circular deps. Viewer imports siblings directly; `saveCurrentContentToFile` lives in `file-operations` so helpers no longer cycle.
