# Contributing

Thanks for helping with MDViewer. Keep changes focused; match existing style.

## Setup

Requires **Node.js >= 20** and **pnpm**.

```bash
pnpm install
cp .env.example .env.local
pnpm web:dev      # SPA
pnpm worker:dev   # share API (optional)
```

See [`docs/getting-started.md`](./docs/getting-started.md) and [`docs/deploy.md`](./docs/deploy.md).

## What to work on

Maintainer planning lives under [`maintainer/`](./maintainer/):

- **Focus:** [`maintainer/phases/focus.md`](./maintainer/phases/focus.md)
- **Parked:** [`maintainer/phases/parked.md`](./maintainer/phases/parked.md)
- **Appflare (after v4):** [`maintainer/phases/appflare.md`](./maintainer/phases/appflare.md)
- **Shipped log:** [`maintainer/shipped/README.md`](./maintainer/shipped/README.md)

Do not start queued work until Focus promotes it. Product docs for users: [`docs/`](./docs/).

## Pull requests

- One concern per PR when practical
- Run `pnpm typecheck` (and relevant app builds) before asking for review
- Do not claim unshipped Worker features (password, TTL, MCP) in README / llms / API docs
- Commit messages: short “why”; see [`maintainer/agents/git.md`](./maintainer/agents/git.md) if contributing as an agent

## Code of conduct

Participation is governed by [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities per [`SECURITY.md`](./SECURITY.md). Do not paste private exploit PoCs in public issues.
