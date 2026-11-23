# Phase 07 — Manage token + view-password split (protocol 3)

**Focus label:** **Now** ([`focus.md`](./focus.md))  
**Order:** after 01–03 shipped; before 05 / 04 remaining / 06  
**Status:** A–E done (prod smoke 2026-11-23). Follow-ups folded: R2 wipe done; share ids → hex; manage/view secret gen unbiased.  
**Depends on:** Protocol 2 live (01–03); SPA shares binding (02)  
**Goal:** Split **view** vs **manage** capabilities. Stop using one password hash for both GET-protect and mutate/delete.  
**Hard cut:** Protocol **3 only** in code/docs — no protocol-2 dual auth, no flat-key legacy. Wipe Worker R2 before real v4 ([`../final.md`](../final.md)). Stay on **3.x.x** until `final.md` clears; then **v4.0.0**.  
**Systems map:** [`../systems/worker.md`](../systems/worker.md)

---

## Slices (implement in order)

| Slice | Scope | Done when |
|-------|--------|-----------|
| **A** Worker | In-place auth swap; `manageTokenHash` + optional view `passwordHash`; Bearer manage on upload/mutate/delete; `X-Share-Password` view-only; efficient bulk rotate (N=50); central `lib/config.ts`; `/compatibility` protocol 3 + `limits`; MCP tools use manageToken; drop flat-key / protocol-2 paths | Worker tests/smoke green |
| **B** SPA settings + compose | `#token` rename; auto-gen; block share if missing; rotate confirm → bulk rotate local ids (batch size from compatibility); view-protect → disposable auto-gen field; already-shared (existing / new link / edit protect / delete); SPA **reads** `/compatibility` and adapts (no hardcoded caps) | Editor share flow uses manage token only |
| **C** Shares page | Edit next to Copy (mobile-friendly) → same already-shared dialog | Parity with editor; no second delete-only UX |
| **D** Agents + public docs | `llms.txt` / `llms-full.txt`; MCP args; regen Worker embed; `docs/api.md` + `security.md` + README + deploy/self-host (`config.ts`) | Agents cannot treat view password as admin |
| **E** Migrate + smoke | Settings key migrate (**done** in B); local + prod smoke; R2 wipe before real v4 | Focus promotes **Next** (05) |

Do not start B until A’s auth split is deployable. C may land in the same PR as B if the dialog is already shared. D can share a PR with E.

**Slice A approach:** in-place swap on existing routes (not a Worker rewrite).

### Slice A — implementation checklist

> Agentic workers: TDD per step. Caps/literals live in `config.ts`. Protocol 3 only.

- [x] **A1** Create `apps/worker/src/lib/config.ts` (TTL, `MAX_FILE_SIZE`, `ROTATE_MANAGE_MAX_IDS=50`, fair-use defaults). Rewire `ttl.ts` / `content.ts` / `fair-use.ts` to import from it. Tests still pass.
- [x] **A2** Extend `ShareMetadata` → `manageTokenHash` + `protocol: 3`; public meta `protocol: 3`. Add `readManageToken` + `requireManageToken` / view-only password helper in `password.ts` (or small `share-auth` helpers). Unit tests for header parse + auth fail paths.
- [x] **A3** `upload.ts` + `share.ts`: manage required on create/mutate/delete; view password GET-only; remove flat-key / protocol-2 mutate paths. CORS: `Authorization`, `X-Share-Manage-Token`.
- [x] **A4** `POST /share/rotate-manage`: hash-once, parallel meta, cap 50, partial `{ updated, failed }`, fair-use. Tests for cap / partial / hash-once.
- [x] **A5** `/compatibility` → protocol 3, features (`manageToken`, `viewPasswordSeparate`, …), `limits`, rotate endpoint listed. OpenAPI descriptions updated.
- [x] **A6** MCP tools: `manageToken` for upload/mutate/delete; view password GET-only.
- [x] **A7** Worker unit tests green (`pnpm test` in `apps/worker`). Prod/wrangler smoke + SPA (B) still open.

---

## Why

Today `meta.passwordHash` gates:

- view-protected **GET**
- **PUT / PATCH / DELETE**

So a “view password” shared with a reader is also the admin secret. That is the bug worth fixing. Secondary wins: no passwordless orphans, no claim race, agent-friendly mutate, rotatable creator secret.

---

## Capabilities (never conflate)

| Capability | What | Who |
|------------|------|-----|
| **View** | Share ID (128-bit hex) in the public link | Anyone with the URL |
| **View-protect** | Optional **per-share disposable password** (auto-generated when protect is turned on; user may edit) | People the creator trusts to *read* |
| **Manage** | **Manage token** (settings-scoped, required to share) | Creator device / SPA / MCP client |

- Mutate (replace content, toggle `viewProtected`, rotate view password, delete) requires **manage token**, not the view password.
- Public link never embeds the manage token.
- Losing the manage token → local shares become immutable until TTL (documented). Operator host wipe-by-ID remains the abuse escape hatch.

---

## Product rules (agreed)

### Settings manage token (`#token`, was `#password`)

- Auto-generate on first use / new device if missing.
- **Required to share** — block upload/compose if unset.
- Stored only in local settings (same class of secret as today’s default share password).
- **Rename** Settings deep link `#password` → `#token`; copy/UI says “manage token”, not “share password”.
- Changing the token = **rotation** of all locally tracked shares that use the old token:
  - Confirm dialog: clear that stored shares will be re-keyed / may fail mutate until rotated.
  - Persist new token only after confirm.
  - Call worker **bulk rotate** for bound `shareId`s (see API).

### Share dialog — view password is disposable

- When user enables **view protection**, show a field with an **auto-generated** password (user can change or keep).
- View password is **per share**, managed via manage token (change / clear protect from already-shared UI).
- Turning protect off clears the view hash; manage token unchanged.

### Already-shared is core UX

- Keep tracking shared items locally (`shareId`, manage binding, optional view password copy for the creator).
- Opening Share on a bound file/project → **already-shared** state:
  - **Use existing link** (copy / open)
  - **New link** (create new share id; old id remains until TTL unless deleted)
  - Edit protect / rotate disposable view password / delete remote — all with manage token
- Same dialog behavior in **editor** and **Shares page**.

### Shares page parity

- Next to **Copy**: **Edit** (mobile: icon or compact control) opens the same already-shared compose/manage dialog as the editor.
- No second, weaker UI.

---

## Locked design (Worker / protocol 3)

### Security

- Hashes live only in R2 `metadata.json`. Public meta never returns hashes — only booleans (`viewProtected`, `hasPassword`).
- Client sends plaintext once in headers; Worker PBKDF2-hashes and constant-time compares (`hashPassword` / `verifyPassword`).
- View password **never** authorizes upload/mutate/delete/rotate.
- Rejected: server-minted JWTs / operator HMAC secrets (wrong fit for device-held manage token).

### Metadata

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
  passwordHash: string | null; // view-only
  viewProtected: boolean;
  protocol: 3;
};
```

Objects without `manageTokenHash` fail manage auth — no dedicated legacy branch.

### Auth matrix

| Operation | Credential |
|-----------|------------|
| `POST /upload` | Manage token **required**; optional `X-Share-Password` if creating view-protected |
| `GET /share/:id` | `X-Share-Password` iff `viewProtected` |
| `GET /share/:id/meta` | Anonymous |
| `PUT / PATCH / DELETE /share/:id` | Manage token |
| `POST /share/rotate-manage` | Bearer **old** manage token; body `newManageToken` |

Headers: manage = `Authorization: Bearer <token>` (preferred) or `X-Share-Manage-Token`; view = `X-Share-Password` only. CORS must allow `Authorization` + `X-Share-Manage-Token`.

### Bulk rotate (efficient)

`POST /share/rotate-manage`

- Body: `{ shareIds: string[], newManageToken: string }`
- Cap: **`ROTATE_MANAGE_MAX_IDS = 50`** (from central config); over → 400
- **Hash `newManageToken` once**; write that same hash onto every updated share
- Parallel `readMetadata` → verify old token per id → parallel metadata puts (file blobs untouched)
- Response 200: `{ updated: string[], failed: { id, error }[] }` — partial OK
- Fair-use: same upload-class fingerprint DO

### Central config + compatibility

- **`apps/worker/src/lib/config.ts`** — single home for TTL bounds, `MAX_FILE_SIZE`, `ROTATE_MANAGE_MAX_IDS`, fair-use defaults (env `RATE_LIMIT_*` overrides stay). Self-host: edit + redeploy; see `docs/deploy.md`.
- Other libs import from `config.ts` (one literal home).
- `GET /compatibility` → `protocol: 3`, features (`manageToken`, `viewPasswordSeparate`, `fixedTtl`, `viewProtected`, `fairUseFingerprint`, `mcp`, `llmsTxt`), `ttl`, `limits: { maxFileBytes, rotateManageMaxIds }`, endpoints (incl. rotate-manage + Bearer manage descriptions).
- SPA (B+): **read** compatibility for the configured API URL and adapt TTL UI / rotate batch size — do not hardcode caps. Not a Worker config-write API.

### MCP (Slice A)

- Upload / mutate / delete require `manageToken`; view-protected GET still uses view password only.
- Stop teaching view password as admin. Full llms regen can land in D; auth behavior must be correct in A.

### Hard cut / ops

- No protocol-2 dual auth in Worker or public docs.
- Wipe Worker R2 before real **v4.0.0** (`final.md` checkbox).
- SPA (B/E): migrate settings `#password` → `#token` locally.

### Slice A tests

- Manage required on upload/PUT/PATCH/DELETE; view password alone cannot mutate
- View-protected GET still needs `X-Share-Password`
- Rotate: hash-once, cap 50, partial failure shape
- Compatibility protocol 3 + `limits.rotateManageMaxIds`
- Caps enforced via central config values

### Out of Slice A

- SPA Settings / compose / Shares Edit (B/C)
- Public docs honesty beyond MCP auth correctness (D + phase 05)
- Appflare pack (06)
- Worker config-write API

---

## SPA / MCP / docs checklist

### SPA

- [x] Settings `#token`: generate, show/copy, rotate with confirm + bulk rotate of local share ids
- [x] Block share without manage token
- [x] Compose: view-protect → auto-gen disposable password field
- [x] Already-shared dialog (existing link / new link / update + view protect)
- [x] Shares page: Edit → same dialog (existing-link mode); mobile-friendly icon+label
- [x] Local storage: `manageToken` (+ migrate from `defaultSharePassword`); view password on file/link optional
- [x] Adapt TTL / rotate batch size from `/compatibility` for configured API URL

### Worker

- [x] `lib/config.ts` + consumers
- [x] Metadata: `manageTokenHash` always; `passwordHash` = view-only optional; `protocol: 3`
- [x] Auth split on GET vs mutate; drop flat-key / protocol-2 paths
- [x] Bulk rotate endpoint + fair-use
- [x] Compatibility protocol 3 + features + `limits`
- [x] OpenAPI / Swagger route descriptions
- [x] MCP tools: manageToken for mutate/upload

### Agent surfaces

- [x] `llms.txt` / `llms-full.txt` — manage vs view password; MCP args
- [x] Regen worker embedded llms

### Public docs

- [x] `docs/api.md`, `docs/security.md`, README share section, `docs/deploy.md` (config.ts self-host)

---

## Explicitly out of scope (this phase)

- User accounts / OAuth
- Claim-on-first-mutate as the headline (optional tiny IP-bound rescue later only)
- Sliding TTL
- Putting manage token in the public URL
- Protocol-2 / flat-key compatibility shims

---

## Related

- Protocol 2 baseline (historical): [`01-share-protocol.md`](./01-share-protocol.md), [`02-share-dialog.md`](./02-share-dialog.md)
- Worker systems map: [`../systems/worker.md`](../systems/worker.md)
- Appflare: [`06-appflare.md`](./06-appflare.md) (after this protocol stabilizes)
- Pre-v4 checklist: [`../final.md`](../final.md)
