# Changelog

## [1.0.0](https://github.com/elydelva/roadkit/compare/core-v0.1.0...core-v1.0.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **core:** The ADR/Task domain is removed entirely with no legacy support. The core model is now a Linear-like hierarchy of Project -> Milestone -> Issue plus Spec, retaining the agent-native spine (gates/DAG, rules, traces, next/context). Value objects, statuses, entities, the IRealmRepository port, services, use cases, and errors are all replaced. TraceId is now timestamp+hex based and generated without a counter.

### Features

* **cli:** implement v0.1 CLI — 7 commands ([9ad155d](https://github.com/elydelva/roadkit/commit/9ad155d5867df02d05aa6b860ca93a2b2aa4a798))
* **core:** add RealmConfig with estimation scales and custom priority ([15b63e4](https://github.com/elydelva/roadkit/commit/15b63e40e7228338ae9f7fdfe497ce01f03473d5))
* **core:** add rkit brief — inject-ready context, rules, and blockers ([d21d846](https://github.com/elydelva/roadkit/commit/d21d84605d851876c169cae6fdf3047312828550))
* **core:** honest agent attribution with --actor/--actor-type/--message ([5b545ca](https://github.com/elydelva/roadkit/commit/5b545ca95968af7de412d3b76af8bbe33ee088e5))
* **core:** implement domain entities, ports, services and use cases ([fbce5e8](https://github.com/elydelva/roadkit/commit/fbce5e85a9f928b414493361390443bd9f8b3974))
* **core:** optional branch field on issues, settable on add/start/complete ([#14](https://github.com/elydelva/roadkit/issues/14)) ([cedd861](https://github.com/elydelva/roadkit/commit/cedd8612063e34eea66e2eeeeea0f915869bc588))
* **core:** pivot domain to Project/Milestone/Issue + Spec ([af86520](https://github.com/elydelva/roadkit/commit/af865202fa3aab52b968b9122b2eb5a433bf57bf))
* extensible RealmConfig (estimation scales + custom priority + labels) ([13459a0](https://github.com/elydelva/roadkit/commit/13459a0954210d9dbf824f95e49823cfa6f23482))
* **fs,core,cli:** implement adrkit history ([eda2d2a](https://github.com/elydelva/roadkit/commit/eda2d2ae315291cddcd44304089a13be8ac7b2a0))
* **fs,git:** implement filesystem and git adapters ([d4bc9bd](https://github.com/elydelva/roadkit/commit/d4bc9bdd11c1aff84d9a81105492eb8686820d5d))
* issue management command suite + slug-stable saves ([#17](https://github.com/elydelva/roadkit/issues/17)) ([97f31d8](https://github.com/elydelva/roadkit/commit/97f31d8dc05308ffbd420ddede5ff2f3e5a918e4))
* **lint:** realm integrity linter and rkit lint ([eafffb3](https://github.com/elydelva/roadkit/commit/eafffb3d88a891b4237d5d83ac76d95e31bb3779))


### Bug Fixes

* **ci:** resolve @roadkit/* from source in bun tests ([520faea](https://github.com/elydelva/roadkit/commit/520faeafd2d7c2a252c82a270e691b3d52734da4))
* **core:** single-point git staging + project/milestone status transitions ([91c89bf](https://github.com/elydelva/roadkit/commit/91c89bf96371d6930c031dc56638cdab9b9ca60d))
