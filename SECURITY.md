# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 3.x (pre-v4.0) | Yes — current line |
| &lt; 3.0 | Best-effort only |

## Reporting a vulnerability

**Do not** open a public issue for sensitive exploit details against production share hosts.

1. Prefer a **private** GitHub security advisory on [zamdevio/mdviewer](https://github.com/zamdevio/mdviewer), or contact the maintainers via GitHub.
2. Include: affected surface (SPA preview, Worker share API, Settings override, etc.), steps to reproduce, and impact.
3. Allow reasonable time for a fix before public disclosure.

We will acknowledge reports and coordinate disclosure once a fix or mitigation is available.

## Threat model & mitigations

See [`docs/security.md`](./docs/security.md) for the full threat model, hardened items (with code pointers), and known/queued gaps (e.g. share password + TTL until Phase C).
