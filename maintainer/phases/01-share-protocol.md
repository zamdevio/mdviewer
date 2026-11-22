# Phase C — Worker share protocol

**Focus label:** **Shipped** ([`focus.md`](./focus.md))  
**Order:** 01 (implement first)  
**Status:** Shipped (worker protocol 2) — superseded for *new* work by [`07-manage-token.md`](./07-manage-token.md) (protocol 3)  
**Depends on:** Phases A–B shipped

## Goals

Replace flat R2 blobs with prefix layout, password-gated mutate, fixed TTL + cron, fair-use DO.

## R2 layout

```text
shares/{shareId}/metadata.json
shares/{shareId}/files/{originalFilename}.md
```

`type`: `file` | `project`

## Password

- Hash in metadata (never plaintext)
- DELETE + content PUT always require password (`X-Share-Password`)
- `viewProtected` gates GET only

## TTL (fixed only)

| Rule | Value |
|------|--------|
| Default | 7 days |
| Max | 30 days |
| Min | 60 seconds |
| `expiresAt` | Set once at create |
| Visits / content PUT | Do not change `expiresAt` |
| Cron | Daily delete expired prefixes |
| Responses | Expose `expiresAt` (wipe time) |

## Fair-use DO

- Fingerprint: IP + UA (+ CF signals); IP backstop for CGNAT
- Stricter on agent/MCP-shaped traffic
- Not user accounts — abuse gate only

## API (target)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/upload` | Create; hash + TTL |
| GET | `/share/:id` (+ file subpath) | View; expiry headers |
| GET | `/share/:id/meta` | Anon meta |
| PUT | `/share/:id` | Replace content; keep expiry |
| PATCH | `/share/:id` | `viewProtected` only |
| DELETE | `/share/:id` | Wipe prefix |
| Cron | scheduled | Sweep expired |

Bump `/compatibility` protocol. Migrate/legacy flat keys documented here when implementing.

## Checklist

- [x] Layout + metadata schema
- [x] Password hash verify
- [x] Fixed TTL + cron
- [x] Fair-use DO upgrade
- [x] CORS methods/headers
- [x] `docs/api.md` + worker systems doc

## Notes

- SPA upload without password still works (public GET; mutate blocked until password was set at create).
- Phase D wires password / TTL / protect-view UI.
