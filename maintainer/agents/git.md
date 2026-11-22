# Git — MDViewer

## 1. Never surprise the user

- **Do not commit** unless the user explicitly asks to commit.
- **Do not push** unless the user explicitly asks to push.
- **Do not** create tags, open PRs, or publish unless asked.

If unsure — **ask**.

---

## 2. Gates before commit

When the user asks to commit:

1. Inspect `git status` / `git diff` (staged + unstaged)
2. Exclude secrets and `maintainer/temp/`
3. Run a sensible local gate (`pnpm typecheck` / `pnpm web:build`) when the change warrants it
4. One logical change set per commit

Author identity for this repo: **`zamdevio <me@zamdev.io>`**.

Before push (when asked): confirm branch/remote; never force-push `main` unless explicitly demanded.

---

## 3. Conventional commits

```text
<type>(optional-scope): <short imperative summary>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`.

Scopes: `web`, `worker`, `docs`, `maintainer`.
