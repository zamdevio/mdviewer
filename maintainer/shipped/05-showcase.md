# Showcase — feature surface honesty

**Focus label:** **Shipped** (visibility follow-up 2026-11-23) ([`focus.md`](./focus.md))  
**Order:** after protocol 3 (07); before remaining perf (04)  
**Goal:** Keep README, home, and `docs/` aligned with what we actually ship — especially agent-native surfaces that obey the same share rules as humans.  
**Status:** Honesty pass 2026-11-23; **visibility** pass same day — MCP/llms not buried

## Slices

| Slice | Scope | Done |
|-------|--------|------|
| **1** | README + home bullets = protocol 3 + MCP truth | [x] |
| **2** | `docs/api.md` / `security.md` + SPA/Worker `llms*` parity | [x] (07D + follow-up) |
| **3** | Compatibility flags / agent parity blurb (manage vs view) | [x] |
| **4** | Visibility — README header MCP + favicon + llms badges; home MCP card + hero links; getting-started manage/MCP | [x] |

## Principle

Agents get the **same API**, same fair-use, same manage/view/TTL rules as the SPA. Showcase copy must not imply a privileged agent path.

## Surfaces to keep in sync

| Surface | What to say |
|---------|-------------|
| Root [`README.md`](../../README.md) | Product + protocol 3 + MCP + `/llms*.txt` + local-first |
| Home (`apps/web` landing) | Hero-level product truth; edge share = manage + view + MCP parity |
| [`docs/`](../../docs/) | `api.md`, `security.md`, getting-started — no stale “coming soon” for shipped C–E / 07 |
| SPA + Worker [`llms.txt`](../../apps/web/public/llms.txt) / [`llms-full.txt`](../../apps/web/public/llms-full.txt) | Agent brief SoT in web/public; Worker embeds generated copy |
| MCP (`POST /mcp`) | Tools list matches reality; brand icon on API origin |

## Checklist (run before each minor/major)

- [x] README “features / Now Available” matches shipped protocol 3 + MCP
- [x] README header badges include MCP (+ API favicon) and llms.txt
- [x] Home page: agent band (MCP / llms.txt) + 6 feature tiles match README (no orphan claims)
- [x] `docs/getting-started.md` covers manage token + MCP / llms
- [x] `docs/api.md` lists `/mcp`, `/llms*`, manage Bearer + view `X-Share-Password`, TTL, bulk rotate
- [x] `docs/security.md` fair-use + agent-shaped traffic + manage vs view
- [x] `llms-full.txt` regenerated into Worker after SPA edit
- [x] Compatibility `protocol: 3` + manage flags true on prod (smoke 2026-11-23)
- [x] Explicit line: **agents and humans share the same manage/view rules**

## Agent parity blurb (canonical)

> Optional share API on Cloudflare Workers. Mutate/delete use the **manage token**; view-protected GETs use the disposable **view password**. Same TTL and fair-use whether the client is the SPA, curl, or MCP (`POST /mcp`). Prefer `/llms.txt` then `/llms-full.txt` before calling tools.

## Out of scope

- Marketing site redesign
- v4 claims (virtual scroll / 5–10MB) until Phase 04 clears them
