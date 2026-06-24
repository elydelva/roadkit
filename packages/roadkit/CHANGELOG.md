# Changelog

## [1.0.0](https://github.com/elydelva/roadkit/compare/roadkit-v0.1.0...roadkit-v1.0.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **cli:** rewrite rkit commands for project-rooted model

### Features

* **cli:** emit JSON from mutation commands + structured errors ([0c86ae6](https://github.com/elydelva/roadkit/commit/0c86ae678ec477c049dbb96c6287ce7076841358))
* **cli:** rewrite rkit commands for project-rooted model ([5dedaa3](https://github.com/elydelva/roadkit/commit/5dedaa36e422147430d38e294c66b47d49a62818))
* **cli:** scaffold AGENTS.md and a pre-commit lint hook on init ([8b12e8c](https://github.com/elydelva/roadkit/commit/8b12e8c51098567f9377e66a8b8f0bf2bb0b6137))
* **cli:** validate --labels against the configured taxonomy ([b6d0a1f](https://github.com/elydelva/roadkit/commit/b6d0a1fba8cafd761215dfbe732a2c6984c5941b))
* **cli:** wire RealmConfig into init/next/issue-add ([8bccc5c](https://github.com/elydelva/roadkit/commit/8bccc5cbfd21b90d58093cfdade62f908f213f01))
* **core:** add rkit brief — inject-ready context, rules, and blockers ([d21d846](https://github.com/elydelva/roadkit/commit/d21d84605d851876c169cae6fdf3047312828550))
* **core:** honest agent attribution with --actor/--actor-type/--message ([5b545ca](https://github.com/elydelva/roadkit/commit/5b545ca95968af7de412d3b76af8bbe33ee088e5))
* **core:** optional branch field on issues, settable on add/start/complete ([#14](https://github.com/elydelva/roadkit/issues/14)) ([cedd861](https://github.com/elydelva/roadkit/commit/cedd8612063e34eea66e2eeeeea0f915869bc588))
* extensible RealmConfig (estimation scales + custom priority + labels) ([13459a0](https://github.com/elydelva/roadkit/commit/13459a0954210d9dbf824f95e49823cfa6f23482))
* issue management command suite + slug-stable saves ([#17](https://github.com/elydelva/roadkit/issues/17)) ([97f31d8](https://github.com/elydelva/roadkit/commit/97f31d8dc05308ffbd420ddede5ff2f3e5a918e4))
* **lint:** realm integrity linter and rkit lint ([eafffb3](https://github.com/elydelva/roadkit/commit/eafffb3d88a891b4237d5d83ac76d95e31bb3779))


### Bug Fixes

* **core:** single-point git staging + project/milestone status transitions ([91c89bf](https://github.com/elydelva/roadkit/commit/91c89bf96371d6930c031dc56638cdab9b9ca60d))
* **git:** run git in realm root and make staging best-effort ([14c43c2](https://github.com/elydelva/roadkit/commit/14c43c20c614145f7a6f25e4ba1d69bfeeaaca7b))


### Documentation

* update README, rules and templates for roadkit/project-rooted model ([ce80ced](https://github.com/elydelva/roadkit/commit/ce80ced7754fb3476c3150f0d94bc8dcd235efa4))
* update versioning and PR templates to clarify Roadkit issue completion process ([57206cd](https://github.com/elydelva/roadkit/commit/57206cd6d9ec22c9359edad1145e4a8e218df30a))
