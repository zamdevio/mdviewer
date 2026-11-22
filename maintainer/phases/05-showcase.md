# Showcase — feature surface honesty

**Order:** 05  
**Goal:** Keep README, home, and `docs/` aligned with what we actually ship — especially agent-native surfaces that obey the same share rules as humans.  
**Status:** Queued (Focus slot free when ready)

## Principle

Agents get the **same API**, same fair-use, same password/TTL/`viewProtected` rules as the SPA. Showcase copy must not imply a privileged agent path.

## Surfaces to keep in sync

| Surface | What to say |
|---------|-------------|
| Root [`README.md`](../../README.md) | Product + protocol 2 + MCP + `/llms*.txt` + local-first |
| Home (`apps/web` landing) | Hero-level product truth; agent/MCP only if still accurate |
| [`docs/`](../../docs/) | `api.md`, `security.md`, getting-started — no stale “coming soon” for shipped C–E |
| SPA + Worker [`llms.txt`](../../apps/web/public/llms.txt) / [`llms-full.txt`](../../apps/web/public/llms-full.txt) | Agent brief SoT in web/public; Worker embeds generated copy |
| MCP (`POST /mcp`) | Tools list matches reality; brand icon on API origin |

## Checklist (run before each minor/major)

- [ ] README “features / Now Available” matches shipped protocol + MCP
- [ ] Home page bullets match README (no orphan claims)
- [ ] `docs/api.md` lists `/mcp`, `/llms*`, password/TTL headers
- [ ] `docs/security.md` fair-use + agent-shaped traffic noted
- [ ] `llms-full.txt` regenerated into Worker after SPA edit
- [ ] Compatibility `features.mcp` / `llmsTxt` true on prod
- [ ] Explicit line: **agents and humans share the same mutate/view rules**

## Agent parity blurb (canonical)

> Optional share API on Cloudflare Workers. Upload/replace/delete and view-protected GETs use the same password, TTL, and fair-use limits whether the client is the SPA, curl, or MCP (`POST /mcp`). Prefer `/llms.txt` then `/llms-full.txt` before calling tools.

## Out of scope

- Marketing site redesign
- v4 claims (virtual scroll / 5–10MB) until Phase 04 clears them
