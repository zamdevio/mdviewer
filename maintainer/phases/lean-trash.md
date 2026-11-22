# Phase B — Lean trash

**Status:** Shipped  
**Depends on:** Phase A

## Goals

Local soft-delete for files and projects with a Settings toggle and restore list. No server.

## Model

- Soft-delete stores entries in `mdviewer_trash` (cap 50)
- Settings: Trash on/off (default on). Off = permanent delete after confirm
- Settings UI: list files + projects, Restore / Delete forever / Empty trash
- Import/export: trash excluded (local-only)

## Checklist

- [x] Storage shape + migrate helpers (`trashOrDeleteFile` / `trashOrDeleteProject`)
- [x] Wire file/project delete paths (Files page + editor `deleteFile`)
- [x] Settings Trash section + restore/purge
- [x] Confirm dialogs note soft vs hard delete
