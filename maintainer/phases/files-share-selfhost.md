# Files tree + share self-host + connection dialogs

**Status:** Shipped + tree UX polish.  
**Related:** README / docs showcase for BYO API, projects, badge dialogs.

## Checklist

- [x] Connection badge dialogs for all states (incl. connected); share-off → `/settings#share`
- [x] Settings `#share` runtime API override + Default confirm + Test connection
- [x] Worker `GET /compatibility`
- [x] Files grid + tree + virtual projects + import/export
- [x] README + docs updates
- [x] Vite public URL defaults in `vite.config.ts` + `.env.example` / deploy docs (not secrets)
- [x] Tree DnD onto projects; ⋮ + right-click menus; file rename inline
- [x] Searchable `ProjectPicker` (grid + tree move submenu); max-height scroll
- [x] Import merge: identical content fingerprint skip; projects merge by name
- [x] Project share pack `MDVIEWER_PROJECT_V1` over existing `/upload`; share page import UI

## Follow-ups (optional)

- Nested projects
- Settings portals → ModalShell migration
- Project pack size / multi-upload if packs hit worker body limits
