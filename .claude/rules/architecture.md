# Architecture

roadkit is a hexagonal architecture TypeScript monorepo (Bun workspaces). The published binary is `rkit`.

## Package dependency rules

`@roadkit/core` has **zero** monorepo dependencies. All adapter packages depend only on core. The `roadkit` package (binary `rkit`) is the **only** package allowed to import multiple packages — it is the sole DI wiring point.

```
packages/
├── core/     @roadkit/core   — domain entities, ports, services, use cases
├── fs/       @roadkit/fs     — IRealmRepository impl (YAML frontmatter via gray-matter)
├── git/      @roadkit/git    — IGitAdapter impl (git staging via Bun.spawn)
├── lint/     @roadkit/lint   — validation engine (stub in v0.1)
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
- `Priority` (urgent · high · medium · low · none) — on issues.

**Services** (`packages/core/src/services/`):
- `StateMachineService` — enforces valid status transitions.
- `DAGService` — dependency graph, cycle detection, `next` sort ordering.

**Use cases** (`packages/core/src/use-cases/`): `CreateProjectUseCase`, `CreateMilestoneUseCase`, `CreateIssueUseCase`, `CreateSpecUseCase`, `StartIssueUseCase`, `CompleteIssueUseCase`, `SetProjectStatusUseCase`, `SetMilestoneStatusUseCase`, `SetSpecStatusUseCase`, `GetNextUseCase`, `GetContextUseCase`, `GetHistoryUseCase`.

**Ports** (`packages/core/src/ports/`):
- `IRealmRepository` — project/milestone/issue/spec CRUD (`saveProject`, `findMilestonesForProject`, `saveMilestone`, `findIssuesForProject`, `saveIssue`, `findSpecsForProject`, `saveSpec`), trace append (`appendTrace`), plus ID counters.
- `IGitAdapter` — `stage`, `isRepo`.

## File layout on disk

```
.roadkit/config.yml                                        # project config (ID format, types, templates)
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
rkit milestone new | status <id> <status> | start <id>
rkit issue add | start <id> | complete <id>
rkit spec new | status <id> <status>
rkit next
rkit context
rkit history
```

## Key domain concepts

- **Gates** — issue dependency; Issue A gates on Issue B means B must complete first. Cross-project syntax: `PROJ-0001/ISSUE-0003`.
- **Rules** — inline YAML frontmatter constraints (`before_edit`, `after_complete`, etc.) injected into agent system prompts.
- **Milestones / Priority** — used by `rkit next` to prioritize work order.
- **Specs** — decision records attached to a project (the former ADR).
- **Traces** — immutable audit log entries, one file per mutation.
