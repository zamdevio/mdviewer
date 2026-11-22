# Repo health tooling

## knip

```bash
pnpm knip
```

Config: [`knip.json`](../../knip.json). Reports unused deps/exports. Barrel re-exports in `lib/editor` are noisy by design — clean in a dedicated deslop pass.

## madge

```bash
pnpm madge:circular   # fail on cycles
pnpm madge:orphans
pnpm madge:leaves
```

Known cycles (tracked, not blocking 3.x):

1. `components/markdown/index.tsx` ↔ `viewer.tsx`
2. `lib/editor/file-helpers.ts` ↔ `file-operations.ts`
