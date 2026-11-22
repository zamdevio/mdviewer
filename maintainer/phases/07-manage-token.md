# Phase 07 — Manage token + view-password split (protocol 3)

**Focus label:** **Now** ([`focus.md`](./focus.md))  
**Order:** after 01–03 shipped; before 05 / 04 remaining / 06  
**Status:** Spec’d — not started  
**Depends on:** Protocol 2 live (01–03); SPA shares binding (02)  
**Goal:** Split **view** vs **manage** capabilities. Stop using one password hash for both GET-protect and mutate/delete.

---

## Slices (implement in order)

| Slice | Scope | Done when |
|-------|--------|-----------|
| **A** Worker | `manageTokenHash` + optional view `passwordHash`; Bearer manage on mutate/delete/PATCH; `X-Share-Password` view-only; bulk rotate ≤N; `/compatibility` protocol 3 + flags; OpenAPI notes | Worker tests/smoke green; legacy protocol-2 mutate path documented |
| **B** SPA settings + compose | `#token` rename; auto-gen; block share if missing; rotate confirm → bulk rotate local ids; view-protect → disposable auto-gen field; already-shared (existing / new link / edit protect / delete) | Editor share flow uses manage token only |
| **C** Shares page | Edit next to Copy (mobile-friendly) → same already-shared dialog | Parity with editor; no second delete-only UX |
| **D** Agents + public docs | `llms.txt` / `llms-full.txt`; MCP args (`manageToken` vs view password); regen Worker embed; `docs/api.md` + `security.md` + README | Agents cannot treat view password as admin |
| **E** Migrate + smoke | Settings key migrate; protocol-2 object handling; local + prod smoke | Focus promotes **Next** (05) |

Do not start B until A’s auth split is deployable. C may land in the same PR as B if the dialog is already shared. D can share a PR with E.

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
| **View** | Share ID (~130-bit) in the public link | Anyone with the URL |
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

## API (protocol 3)

Bump `/compatibility` → `protocol: 3` + feature flags e.g. `manageToken`, `viewPasswordSeparate`.

### Headers / auth naming

| Concern | Header / mechanism |
|---------|-------------------|
| View password (GET if `viewProtected`) | `X-Share-Password` **view only** |
| Manage (mutate / delete / protect toggle / rotate) | `Authorization: Bearer <manageToken>` (preferred) or `X-Share-Manage-Token` |

Do **not** overload `X-Share-Password` for mutate after this ships.

### Create `POST /upload`

- Requires manage token (header).
- Optional view password headers only if creating already view-protected.
- Response includes: `id`, `frontendShareUrl`, `contentUrl`, `expiresAt`, …  
  Manage token is **not** returned (client already has it from settings). MCP/clients that mint ephemeral tokens still send the same header.

### Mutate

- `PUT /share/:id`, `PATCH /share/:id`, `DELETE /share/:id` → Bearer manage token.
- PATCH may set/clear `viewProtected` and replace view password hash when protect stays on.

### Bulk rotate

- `POST /share/rotate-manage` (or `/shares/rotate-manage`)  
  Body: `{ shareIds: string[], newManageToken` proved by… }`  
  Auth: Bearer **old** manage token; body/header carries proof of **new** token hash to write.  
  Cap **N** ids per request (fair-use; suggest N=20–50).  
  Used when Settings rotates the device manage token so worker metadata `manageTokenHash` matches.

### Host escape hatch

- Operator can wipe any share by ID out-of-band (R2 / admin script). Independent of user tokens. Document in `docs/security.md` + self-host notes.

### Migration from protocol 2

- Old shares: mutate still accepts create-time `X-Share-Password` **or** freeze mutate until re-upload — pick one in implementation and document in `/compatibility`. Prefer: accept legacy password as manage for protocol 2 objects tagged `protocol: 2`, new objects `protocol: 3` manage-only.
- SPA: migrate settings key; map old default share password → manage token once with confirm if needed.

---

## SPA / MCP / docs checklist

### SPA

- [ ] Settings `#token`: generate, show/copy, rotate with confirm + bulk rotate of local share ids
- [ ] Block share without manage token
- [ ] Compose: view-protect → auto-gen disposable password field
- [ ] Already-shared dialog (existing link / new link / edit protect / delete)
- [ ] Shares page: Edit → same dialog; mobile-friendly
- [ ] Local storage: bind `shareId` + manage-token era; store view password for creator convenience only (optional)

### Worker

- [ ] Metadata: `manageTokenHash` always; `passwordHash` = view-only optional
- [ ] Auth split on GET vs mutate
- [ ] Bulk rotate endpoint + fair-use
- [ ] Compatibility protocol 3 + features
- [ ] OpenAPI / Swagger route descriptions

### Agent surfaces

- [ ] `llms.txt` / `llms-full.txt` — manage vs view password; MCP args
- [ ] MCP tools: mutate takes `manageToken`; upload requires it; never document view password as admin
- [ ] Regen worker embedded llms

### Public docs

- [ ] `docs/api.md`, `docs/security.md`, README share section

---

## Explicitly out of scope (this phase)

- User accounts / OAuth
- Claim-on-first-mutate as the headline (optional tiny IP-bound rescue later only)
- Sliding TTL
- Putting manage token in the public URL

---

## Related

- Protocol 2 baseline: [`01-share-protocol.md`](./01-share-protocol.md), [`02-share-dialog.md`](./02-share-dialog.md)
- Appflare still planned: [`06-appflare.md`](./06-appflare.md) (catalog after this protocol stabilizes is fine; don’t block Appflare docs work on 07)
- Pre-v4 checklist: [`../final.md`](../final.md)
