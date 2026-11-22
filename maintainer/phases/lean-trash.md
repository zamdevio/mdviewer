# Phase B — Lean trash

**Status:** Queued  
**Depends on:** Phase A

## Goals

Local soft-delete for files and projects with a Settings toggle and restore list. No server.

## Model

- Soft-delete stores `trashedAt` (or moves into `mdviewer_trash`)
- Settings: Trash on/off (default on). Off = permanent delete after confirm
- Settings UI: list files + projects, Restore / Delete forever / Empty trash
- Cap list; warn on quota
- Import/export: exclude trash by default

## Checklist

- [ ] Storage shape + migrate helpers
- [ ] Wire file/project delete paths through trash when enabled
- [ ] Settings section + restore/purge
- [ ] Confirm dialogs still used for permanent delete
