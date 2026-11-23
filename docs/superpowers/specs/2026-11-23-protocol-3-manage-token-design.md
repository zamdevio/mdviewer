# Protocol 3 — Manage token vs view password (Worker Slice A)

**Date:** 2026-11-23  
**Status:** Approved for planning  
**Phase:** [`maintainer/phases/07-manage-token.md`](../../../maintainer/phases/07-manage-token.md)  
**Focus:** Now — Slice A (Worker) first; SPA/docs follow B–E  
**Versioning:** Stay on **3.x.x** until [`maintainer/final.md`](../../../maintainer/final.md) clears; then **v4.0.0**. No dual-protocol public contract — v4 has not shipped yet.

---

## Problem

Today one `passwordHash` gates both view-protected GET and mutate/delete. A disposable “view password” shared with a reader is also the admin secret. Protocol 3 splits **view** vs **manage**.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Approach | In-place auth swap on existing Worker routes (not a rewrite) |
| Legacy protocol 2 / flat R2 keys | **No support in code or docs.** Protocol 3 only. |
| Pre-v4 R2 | Operator **wipes Worker R2** before real v4 deploy (`final.md` checkbox) |
| Hash model | PBKDF2 hashes stored only in R2 metadata; Worker verifies; public meta never returns hashes |
| Bulk rotate cap | **50** (`ROTATE_MANAGE_MAX_IDS` in central config) |
| Bulk rotate efficiency | Hash `newManageToken` **once**; parallel metadata reads/writes; metadata-only; per-id partial results |
| Config | Central `apps/worker/src/lib/config.ts`; `/compatibility` exposes limits so SPA adapts to BYO Workers |
| SPA “save configs” | SPA **reads** compatibility from the configured API URL and adapts — not a Worker write API |

---

## Security model

1. **Manage token** — creator-held secret (settings / MCP client). Sent as `Authorization: Bearer <token>` (preferred) or `X-Share-Manage-Token`. Stored as `manageTokenHash` only.
2. **View password** — optional per-share disposable secret. Sent as `X-Share-Password` on GET when `viewProtected`. Stored as `passwordHash` only. **Never** authorizes mutate/delete/upload/rotate.
3. Public responses (`/meta`, upload response, etc.) expose booleans (`viewProtected`, `hasPassword`) — **never** hashes or plaintext secrets.
4. Reuse existing `hashPassword` / `verifyPassword` (constant-time compare). Same threat model as protocol 2 passwords; split is capability isolation, not a new crypto primitive.
5. Rejected alternatives for this product: server-minted JWTs / HMAC with operator secrets (extra key management; fights “device holds manage token”).

---

## Metadata shape

```ts
type ShareMetadata = {
  id: string;
  type: "file" | "project";
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  manageTokenHash: string; // required
  passwordHash: string | null; // view-only; null if not view-protected
  viewProtected: boolean;
  protocol: 3;
};
```

Public meta: same identity/TTL fields + `viewProtected` + `hasPassword` + `protocol: 3`. No `hasManageToken` required in public meta (always true for live protocol-3 objects); omit protocol-2-only fields.

Objects missing `manageTokenHash` / not protocol 3 after the cut simply fail manage auth — no dedicated legacy branch.

---

## Auth matrix

| Operation | Credential |
|-----------|------------|
| `POST /upload` | Manage token **required**; optional `X-Share-Password` only if creating view-protected |
| `GET /share/:id` | `X-Share-Password` iff `viewProtected` |
| `GET /share/:id/meta` | Anonymous (no secrets) |
| `PUT /share/:id` | Manage token |
| `PATCH /share/:id` | Manage token (toggle/clear protect; replace view hash when protect stays on) |
| `DELETE /share/:id` | Manage token |
| `POST /share/rotate-manage` | Bearer **old** manage token; body carries `newManageToken` |

CORS allowlist must include `Authorization` and `X-Share-Manage-Token` (keep existing share headers).

---

## Bulk rotate (efficient)

`POST /share/rotate-manage`

**Request**

- Auth: `Authorization: Bearer <oldManageToken>` (or manage header)
- Body: `{ shareIds: string[], newManageToken: string }`
- Cap: `shareIds.length` ≤ `ROTATE_MANAGE_MAX_IDS` (50); else **400**

**Algorithm**

1. Reject empty / over-cap / missing `newManageToken`.
2. `newHash = await hashPassword(newManageToken)` — **once**.
3. `Promise.all` `readMetadata` for all ids.
4. For each: missing / expired → fail entry; else verify old token against that share’s `manageTokenHash`; on match queue metadata update with `manageTokenHash: newHash` (file blobs untouched).
5. `Promise.all` metadata puts for successes.
6. Response **200**: `{ updated: string[], failed: { id: string, error: string }[] }` — partial OK so SPA can retry losers.

Fair-use: apply existing upload-class fair-use to this endpoint (same fingerprint DO).

---

## Central config

**File:** `apps/worker/src/lib/config.ts`

Single export surface for operator-tunable numbers (self-host: edit + redeploy). At minimum move / re-export:

- TTL: min / default / max seconds (from today’s `ttl.ts` constants)
- `MAX_FILE_SIZE` (from `content.ts`)
- `ROTATE_MANAGE_MAX_IDS = 50`
- Fair-use defaults worth documenting (window / max / agent max) — keep env overrides (`RATE_LIMIT_*`) as today; document both in deploy/self-host notes

`ttl.ts` / `content.ts` / `fair-use.ts` import from `config.ts` (or `config.ts` owns the literals and others re-export for stability). Prefer **one literal home**.

**`GET /compatibility`** exposes protocol + features + limits so SPA/BYO clients adapt:

```ts
{
  name: "mdviewer-api",
  version: "...", // worker package/API version string
  protocol: 3,
  features: {
    manageToken: true,
    viewPasswordSeparate: true,
    fixedTtl: true,
    viewProtected: true,
    fairUseFingerprint: true,
    mcp: true,
    llmsTxt: true,
    // drop protocol-2-era "password as mutate" framing
  },
  ttl: { defaultSeconds, minSeconds, maxSeconds },
  limits: {
    maxFileBytes: number,
    rotateManageMaxIds: number,
  },
  endpoints: [ /* include rotate-manage; describe Bearer manage */ ],
  cors: { allowedOriginsConfigured: boolean }
}
```

SPA (later slices): fetch compatibility for the configured API base; drive TTL UI / rotate batch size from `ttl` + `limits` — do not hardcode 50 / TTL bounds in the client when the Worker already publishes them.

Document in `docs/deploy.md` (and self-host notes): change `apps/worker/src/lib/config.ts`, redeploy Worker; point SPA at that API; compatibility drives client limits.

---

## MCP (same Worker PR)

- Upload / mutate / delete tools require **manageToken** args (or equivalent); stop documenting view password as admin.
- View-protected GET still uses view password only.
- Regenerate embedded llms when slice D lands; Slice A at least stops wrong MCP auth behavior so Worker is internally consistent.

---

## Explicitly out of Slice A

- SPA Settings `#token`, compose dialog, Shares Edit (B/C)
- Public docs / llms honesty pass beyond what MCP needs to function (D/E + phase 05)
- Appflare pack (06)
- Implementing a Worker “config write” API

---

## Ops / `final.md`

Add checklist item under pre-v4:

- [ ] Wipe Worker R2 share prefix (or bucket) before real **v4.0.0** deploy so only protocol-3 objects exist

Until wipe, mid-dev leftovers without `manageTokenHash` simply cannot mutate — acceptable; no migration code.

---

## Tests (Slice A done when)

- Manage required on upload / PUT / PATCH / DELETE; view password alone cannot mutate
- View-protected GET still requires `X-Share-Password`
- Rotate: hash-once behavior (single hash string written), cap 50, partial failure shape
- Compatibility: `protocol: 3`, `limits.rotateManageMaxIds`, manage-token feature flags
- Existing TTL / fair-use / content size still enforced via central config values

---

## Implementation approach reminder

In-place swap: replace `requirePassword` mutate path with `requireManageToken`; add `readManageToken`; extend `ShareMetadata`; add rotate route; bump compatibility; centralize config; remove legacy flat-key mutate/GET special cases from the hot path as part of the cut.
