# Versioning, Releases & CI

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org/). Scope = package name without `@roadkit/` (e.g. `core`, `fs`, `git`, `lint`, `tui`, `sync`). The CLI package `roadkit` uses the scope `cli`.

```text
<type>(<scope>): <description>
```

Example: `feat(cli): add rkit history command`

| Type | Changelog | Visible |
|---|---|---|
| `feat` | Features | yes |
| `fix` | Bug Fixes | yes |
| `perf` | Performance | yes |
| `deps` | Dependencies | yes |
| `docs` | Documentation | yes |
| `revert` | Reverts | yes |
| `refactor` | Refactoring | no |
| `test` | Tests | no |
| `chore` | Misc | no |
| `ci` | CI/CD | no |

Breaking changes: `feat(auth)!:` or `BREAKING CHANGE:` footer → major bump.

## Roadkit commit cadence

`rkit start` / `rkit complete` mutate `.roadkit/` files. Don't treat completing an issue as automatic — finishing the work ≠ validating the issue. Run `rkit complete <id>` only when asked or authorised to.

When you do complete, where the `completed` state lands depends on the target:

- **On `main`:** never make a standalone commit just to record completion. Run `rkit complete` *before* the commit so code + `.roadkit/` state land in one commit.
- **On a branch / PR:** no strong opinion — fold `completed` into the final commit, or add a separate completion commit. Either is fine, as long as the issue reaches `completed` within the same PR that ships its code.

## Release flow

Automated via Release Please:
1. Commits land on `main` → Release Please opens/updates a release PR per affected package.
2. Release PR merged → tag + GitHub Release created.
3. `release-please.yml` builds and publishes to npm.

Each `packages/*` package is versioned independently. Manifest: `.release-please-manifest.json`.

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push / PR | Build, typecheck, lint, test |
| `release-please.yml` | Push to `main` | Release PRs + npm publish |
| `audit.yml` | Schedule / push | Security audit |
