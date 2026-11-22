# Web (`apps/web`)

- Entry: `src/main.tsx` → `app-shell/App.tsx`
- Router: `react-router-dom` routes for `/`, `/editor`, `/files`, `/search`, `/shares`, `/share`, `/settings`
- Theme: `next-themes` (works without Next)
- Local storage helpers: `src/lib/storage`
- Share client: `src/lib/api.ts` → Worker
- PWA: `src/pwa/sw.template.js` → Vite plugin emits `/sw.js` with `CACHE_VERSION` from `package.json`
