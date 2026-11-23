# Security

MDViewer is a **local-first** Markdown studio with an optional public share Worker. This doc lists the threat model, what we harden, and what remains intentional / queued.

## Threat model

| Surface | Trust |
|---------|--------|
| Browser localStorage (files, settings) | Same-origin XSS is the main risk |
| Markdown preview (editor + `/share`) | Untrusted Markdown/HTML from user or shared links |
| Share Worker (`POST /upload`, `GET /share/:id`, mutate routes) | Public GET by default; optional disposable view password; mutate/upload require **manage token** (protocol 3) |
| Settings API override | Must not accept `javascript:` / opaque URLs |

## Hardened (with proof in code)

| Gap | Mitigation | Where |
|-----|------------|--------|
| Mermaid XSS (`securityLevel: loose` + HTML labels) | `securityLevel: 'strict'`, `htmlLabels: false` | `apps/web/src/components/markdown/mermaid.tsx` |
| Raw HTML / CSS overlay / `data:` images | Tight `sanitizeSchema` (no `style`, `src` http(s) only); sanitize **after** KaTeX | `html.tsx`, `viewer.tsx` |
| Tabnabbing on links | `rel="noopener noreferrer"` on markdown links + Shares list | `viewer.tsx`, `shares.tsx` |
| Weak CSP / missing font hosts | CSP updated: fonts Google hosts, `frame-ancestors 'none'`, COOP | `apps/web/public/_headers` |
| API override URL injection | `isSafeHttpUrl` — only `http:` / `https:` | `apps/web/src/lib/config.ts` |
| Hostile import filenames | `validateFileName` + `sanitizeFileName` on import | `file-helpers.ts` |
| Frame clickjacking / MIME sniff | `X-Frame-Options: DENY`, `nosniff` | `_headers` |
| Upload abuse (baseline) | Per-IP Durable Object rate limit | `apps/worker` rate limiter |
| Share IDs | 128-bit `crypto.getRandomValues`, lowercase hex (easy double-click copy) | `apps/worker/src/lib/content.ts` |
| Manage / view secret generation | Rejection-sampled alphabet (no ambiguous glyphs; no modulo bias) | `apps/web/src/lib/share/ttl.ts` |
| Export encryption (current) | AES-GCM + PBKDF2 | `apps/web/src/lib/utils.ts` |

## Known / intentional gaps

| Item | Status |
|------|--------|
| Public share GET by id (no view password) | **Intentional** default; set `viewProtected` + disposable view password at create to gate GET |
| Share mutate/delete / upload | **Hardened** — require manage token (`Authorization: Bearer` / `X-Share-Manage-Token`); view password never authorizes mutate |
| Manage token lost on device | Local shares become immutable until TTL; operator can wipe by id out-of-band |
| Fixed TTL + cron expiry | **Hardened** — default 7d / max 30d; daily cron sweep |
| Fair-use fingerprint DO | **Hardened** — IP+UA (+ CF country); stricter agent-shaped limits |
| CSP `script-src 'unsafe-inline'` | Needed for inline theme bootstrap in `index.html`; prefer nonce in a later pass |
| Legacy backup password format (truncated base64) | Accept for decrypt-only; new exports use AES-GCM |
| XSS → rewrite `mdviewer_api_override` | Mitigated by CSP `connect-src` + URL validation; eliminating XSS is the real fix |

## Reporting

Follow [`SECURITY.md`](../SECURITY.md) (private advisory preferred). Please do not post private exploit PoCs against production share hosts without coordination.

Pre–v4.0 tracking: [`maintainer/final.md`](../maintainer/final.md).
