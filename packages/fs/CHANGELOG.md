# Changelog

## [1.0.0](https://github.com/elydelva/roadkit/compare/fs-v0.1.0...fs-v1.0.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **fs:** implement repository for new project-rooted layout

### Features

* **cli:** implement v0.1 CLI — 7 commands ([9ad155d](https://github.com/elydelva/roadkit/commit/9ad155d5867df02d05aa6b860ca93a2b2aa4a798))
* **core:** optional branch field on issues, settable on add/start/complete ([#14](https://github.com/elydelva/roadkit/issues/14)) ([cedd861](https://github.com/elydelva/roadkit/commit/cedd8612063e34eea66e2eeeeea0f915869bc588))
* extensible RealmConfig (estimation scales + custom priority + labels) ([13459a0](https://github.com/elydelva/roadkit/commit/13459a0954210d9dbf824f95e49823cfa6f23482))
* **fs,core,cli:** implement adrkit history ([eda2d2a](https://github.com/elydelva/roadkit/commit/eda2d2ae315291cddcd44304089a13be8ac7b2a0))
* **fs,git:** implement filesystem and git adapters ([d4bc9bd](https://github.com/elydelva/roadkit/commit/d4bc9bdd11c1aff84d9a81105492eb8686820d5d))
* **fs:** implement findTraces with filtering support ([#8](https://github.com/elydelva/roadkit/issues/8)) ([2b17ed5](https://github.com/elydelva/roadkit/commit/2b17ed569ff82cdc0173296892c9dd300db5d78d))
* **fs:** implement repository for new project-rooted layout ([803fc45](https://github.com/elydelva/roadkit/commit/803fc45471f0016194e93b07b7ae0a51e168d072))
* **fs:** read/write RealmConfig ([2e00ab5](https://github.com/elydelva/roadkit/commit/2e00ab5936b3d8c9683aebd1b510207dd33d58ca))
* **fs:** store ADRs under .adrkit/log/ subdirectory ([ff3e9da](https://github.com/elydelva/roadkit/commit/ff3e9dad0971a2fd2838da61d10e11166c00d13e))
* issue management command suite + slug-stable saves ([#17](https://github.com/elydelva/roadkit/issues/17)) ([97f31d8](https://github.com/elydelva/roadkit/commit/97f31d8dc05308ffbd420ddede5ff2f3e5a918e4))
* **lint:** realm integrity linter and rkit lint ([eafffb3](https://github.com/elydelva/roadkit/commit/eafffb3d88a891b4237d5d83ac76d95e31bb3779))


### Bug Fixes

* **ci:** resolve @roadkit/* from source in bun tests ([520faea](https://github.com/elydelva/roadkit/commit/520faeafd2d7c2a252c82a270e691b3d52734da4))
* **core:** single-point git staging + project/milestone status transitions ([91c89bf](https://github.com/elydelva/roadkit/commit/91c89bf96371d6930c031dc56638cdab9b9ca60d))
* **fs:** rename realm config file to roadfig.yml ([026a827](https://github.com/elydelva/roadkit/commit/026a827cb533999e7e16b3f37f57128203f96f1e))
* **fs:** rename realm config file to roadfig.yml ([2ea9e01](https://github.com/elydelva/roadkit/commit/2ea9e017eebeae0af819398930e3b42dc20ba117))
* **git:** run git in realm root and make staging best-effort ([14c43c2](https://github.com/elydelva/roadkit/commit/14c43c20c614145f7a6f25e4ba1d69bfeeaaca7b))
