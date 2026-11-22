# Phase C — Worker share protocol

**Status:** Queued  
**Depends on:** Phase B (or can parallel after A if Focus allows — prefer after B)

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

- [ ] Layout + metadata schema
- [ ] Password hash verify
- [ ] Fixed TTL + cron
- [ ] Fair-use DO upgrade
- [ ] CORS methods/headers
- [ ] `docs/api.md` + worker systems doc
