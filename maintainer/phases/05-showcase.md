# Showcase — feature surface honesty

**Focus label:** **Next** ([`focus.md`](./focus.md)) — right after 07 lands  
**Order:** after protocol 3 (07); before remaining perf (04)  
**Goal:** Keep README, home, and `docs/` aligned with what we actually ship — especially agent-native surfaces that obey the same share rules as humans.  
**Status:** Waiting on 07 — do not rewrite for protocol 2

## Slices

| Slice | Scope |
|-------|--------|
| **1** | README + home bullets = protocol 3 + MCP truth |
| **2** | `docs/api.md` / `security.md` + SPA/Worker `llms*` parity check (regen if 07 missed a line) |
| **3** | Compatibility flags / agent parity blurb (manage vs view) |

## Principle

Agents get the **same API**, same fair-use, same password/TTL/`viewProtected` rules as the SPA. Showcase copy must not imply a privileged agent path.

## Surfaces to keep in sync

| Surface | What to say |
|---------|-------------|
| Root [`README.md`](../../README.md) | Product + protocol 3 + MCP + `/llms*.txt` + local-first |
| Home (`apps/web` landing) | Hero-level product truth; agent/MCP only if still accurate |
| [`docs/`](../../docs/) | `api.md`, `security.md`, getting-started — no stale “coming soon” for shipped C–E |
| SPA + Worker [`llms.txt`](../../apps/web/public/llms.txt) / [`llms-full.txt`](../../apps/web/public/llms-full.txt) | Agent brief SoT in web/public; Worker embeds generated copy |
| MCP (`POST /mcp`) | Tools list matches reality; brand icon on API origin |

## Checklist (run before each minor/major)

- [ ] README “features / Now Available” matches shipped protocol 3 + MCP
- [ ] Home page bullets match README (no orphan claims)
- [ ] `docs/api.md` lists `/mcp`, `/llms*`, manage Bearer + view `X-Share-Password`, TTL, bulk rotate
- [ ] `docs/security.md` fair-use + agent-shaped traffic + manage vs view
- [ ] `llms-full.txt` regenerated into Worker after SPA edit
- [ ] Compatibility `protocol: 3` + `features.mcp` / `llmsTxt` / manage flags true on prod
- [ ] Explicit line: **agents and humans share the same manage/view rules**

## Agent parity blurb (canonical)

> Optional share API on Cloudflare Workers. Mutate/delete use the **manage token**; view-protected GETs use the disposable **view password**. Same TTL and fair-use whether the client is the SPA, curl, or MCP (`POST /mcp`). Prefer `/llms.txt` then `/llms-full.txt` before calling tools.

## Out of scope

- Marketing site redesign
- v4 claims (virtual scroll / 5–10MB) until Phase 04 clears them
