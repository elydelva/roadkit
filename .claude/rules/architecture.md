# Architecture

roadkit is a hexagonal architecture TypeScript monorepo (Bun workspaces). The published binary is `rkit`.

## Package dependency rules

`@roadkit/core` has **zero** monorepo dependencies. All adapter packages depend only on core. The `roadkit` package (binary `rkit`) is the **only** package allowed to import multiple packages — it is the sole DI wiring point.

```
packages/
├── core/     @roadkit/core   — domain entities, ports, services, use cases
├── fs/       @roadkit/fs     — IRealmRepository impl (YAML frontmatter via gray-matter)
├── git/      @roadkit/git    — IGitAdapter impl (git staging via Bun.spawn)
├── lint/     @roadkit/lint   — realm integrity engine (LintEngine, core-only, pure)
├── tui/      @roadkit/tui    — terminal UI via React/Ink (stub in v0.1)
├── sync/     @roadkit/sync   — Linear/GitHub adapters (stub in v0.1)
└── roadkit/  roadkit         — CLI entry point `rkit` + dependency injection
```

## Core domain

The domain is **project-rooted**: a `Project` owns `Milestone`s, `Issue`s and `Spec`s. A `Spec` is the former ADR — now a decision document attached to a project rather than the root entity.

**Entities** (`packages/core/src/entities/`): `Project`, `Milestone`, `Issue`, `Spec`, `Trace`, `Rule` — created via factory functions (not classes).

**Value objects** (`packages/core/src/value-objects/`):
- IDs: `ProjectId` (PROJ-0001), `MilestoneId` (MILE-0001), `IssueId` (ISSUE-0001), `SpecId` (SPEC-0001), `TraceId` (TRACE-0001).
- Statuses: `ProjectStatus` (planned · active · paused · completed · cancelled), `MilestoneStatus` (pending · active · done), `IssueStatus` (not-started · in-progress · completed · abandoned · blocked · skipped), `SpecStatus` (draft · proposed · accepted · superseded · deferred · abandoned).
- `Priority` (`string`) — on issues. Levels are **fully customizable** via `roadfig.yml` (`priority.levels`); the default set is urgent · high · medium · low · none.

**Config** (`packages/core/src/config/`): `RealmConfig` — the extensible realm configuration read from `roadfig.yml`. Holds `estimation` (scale + default + optional `values` override), `priority` (custom `levels` + `default`), and a `labels` taxonomy. Pure helpers — `expandScale`, `resolveEstimate`, `formatEstimate`, `priorityRank`, `validatePriority` — live here with `DEFAULT_CONFIG`. All I/O stays in `@roadkit/fs` (`readRealmConfig` / `writeRealmConfig`).

**Services** (`packages/core/src/services/`):
- `StateMachineService` — enforces valid status transitions.
- `DAGService` — dependency graph, cycle detection, `next` sort ordering.

**Use cases** (`packages/core/src/use-cases/`): `CreateProjectUseCase`, `CreateMilestoneUseCase`, `CreateIssueUseCase`, `CreateSpecUseCase`, `StartIssueUseCase`, `CompleteIssueUseCase`, `SetProjectStatusUseCase`, `SetMilestoneStatusUseCase`, `SetSpecStatusUseCase`, `GetNextUseCase`, `GetContextUseCase`, `GetHistoryUseCase`, `GetBriefUseCase`.

**Ports** (`packages/core/src/ports/`):
- `IRealmRepository` — project/milestone/issue/spec CRUD (`saveProject`, `findMilestonesForProject`, `saveMilestone`, `findIssuesForProject`, `saveIssue`, `deleteIssue`, `findSpecsForProject`, `saveSpec`), trace append (`appendTrace`), plus ID counters. Saves are slug-stable: a title change renames the entity file and removes any stale-slug sibling claiming the same id (so duplicate-id files can't accumulate).
- `IGitAdapter` — `stage`, `isRepo`.

## File layout on disk

```
roadfig.yml                                                # RealmConfig at repo root (estimation · priority · labels)
.roadkit/.state                                            # persistent counters
.roadkit/templates/                                        # entity templates
.roadkit/projects/PROJ-XXXX-slug/specs/SPEC-XXXX.md        # spec (YAML frontmatter + Markdown body)
.roadkit/projects/PROJ-XXXX-slug/milestones/MILE-XXXX.md
.roadkit/projects/PROJ-XXXX-slug/issues/ISSUE-XXXX.md
.roadkit/projects/PROJ-XXXX-slug/traces/TRACE-XXXX.md
```

## CLI surface

```
rkit init
rkit project new | list | status <id> <status> | start <id>
rkit milestone new | list | status <id> <status> | start <id>
rkit issue add | start <id> | complete <id> | status <id> <status>
rkit issue edit <id> | retitle <id> | show <id> | list | rm <id>
rkit issue gate add <id> <gate> | gate rm <id> <gate>
rkit spec new | list | show <id> | status <id> <status>
rkit next
rkit context
rkit history
rkit brief    | --issue <id> · --project <id> · --json
rkit lint     | --json (exit 1 on any error)
rkit doctor   | --fix (repair duplicate-id files)
rkit config get [key] | set <key> <value>
```

`issue edit` patches fields (`--title` renames the file, `--priority`, `--estimate`, `--milestone`, `--assignee`, `--branch`, `--parent`, `--labels`, `--gates`); clear a nullable field with `--no-<field>` (e.g. `--no-assignee`). `issue status` is the generic transition (block/skip/abandon/unblock); → `completed` still enforces gates. `issue list` filters by `--project/--status/--assignee/--milestone/--label/--branch/--priority`. `config set` is limited to `priority.default`, `estimation.scale`, `estimation.default`.

All mutation commands accept `--json` (returns the created/updated entity), plus `--actor` / `--actor-type <human|agent>` / `--message` for trace attribution (env: `ROADKIT_ACTOR`, `ROADKIT_ACTOR_TYPE`). Under `--json`, errors print `{"error":{"code","message"}}` on stderr and exit non-zero. `@roadkit/fs` exposes `scanRealmRaw` (strict frontmatter scan + diagnostics) consumed by `@roadkit/lint`; the `roadkit` CLI wires the two. The lint scan contract (`RealmScan`, `RawEntityRecord`) lives in `@roadkit/core`.

## Key domain concepts

- **Gates** — issue dependency; Issue A gates on Issue B means B must complete first. Cross-project syntax: `PROJ-0001/ISSUE-0003`.
- **Rules** — inline YAML frontmatter constraints (`before_edit`, `after_complete`, etc.) injected into agent system prompts.
- **Milestones / Priority** — used by `rkit next` to prioritize work order. Priority ordering follows `priority.levels` in `roadfig.yml` (index 0 = highest).
- **Estimation** — `roadfig.yml` `estimation.scale` (none · linear · fibonacci · tshirt · exponential · hours) drives `--estimate <label|number>` resolution; estimates are stored as points and displayed as scale labels (e.g. `M`).
- **Labels** — shared taxonomy declared under `roadfig.yml` `labels`.
- **Assignee / Branch** — optional free-form strings on an issue. `assignee` names the responsible person; `branch` names the git branch where the issue is implemented. Both settable via `--assignee` / `--branch` on `issue add | start | complete` (start/complete only overwrite when the flag is passed). Not validated by lint; multiple issues may share a branch.
- **Specs** — decision records attached to a project (the former ADR).
- **Traces** — immutable audit log entries, one file per mutation.
