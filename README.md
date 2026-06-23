# roadkit

> *Git tracks what changed. roadkit tracks why.*

---

You're building with AI agents. Your codebase moves faster than ever. But the agents don't know why you made that call three weeks ago — and neither will you in six months.

roadkit is a planning layer that lives inside your repository. Projects, milestones and issues, documented and versioned alongside the code they describe — with the decisions (specs) attached to the projects they shaped. Every agent that touches your project gets the context and rules before it acts.

No PM required. No external board. No documentation that rots because it lives somewhere else.

---

## The idea

Every project has two layers: the technical and the operational. As a solo dev or small team, you've always had to choose between maintaining the operational layer and actually shipping.

roadkit automates the operational layer.

You describe a project. roadkit creates the structure — milestones, issues, dependencies, rules. Your agents read that structure, know what to do next, and follow the constraints you set. You stay in the technical layer. The rest runs itself.

```bash
# You have an idea
rkit project new --title "Auth overhaul"

# PROJ-0001 created. Plan the milestones and issues under it.
rkit milestone new --project PROJ-0001 --title "JWT + refresh tokens"
rkit issue add --milestone MILE-0001 --title "Implement token rotation"

# Capture the decision behind it as a spec attached to the project
rkit spec new --project PROJ-0001 --title "Switch auth to JWT + refresh tokens"

# Your agent now has context before it touches a single file.
rkit context --active | pbcopy
# → paste into your agent. It knows the why, the rules, the order.

rkit next
# → ISSUE-0041: Implement token rotation logic
#    3 other issues will unblock after this one. Start here.
```

---

## Why it works for AI-assisted development

Agents are fast. They're also stateless — they have no memory of the decision that shaped the file they're about to rewrite.

roadkit gives them that memory, in a format they can actually use:

```bash
rkit context --issue ISSUE-0041 --json
# Returns: current project state, applicable rules, blocked issues,
#          what depends on this, what this depends on.
# One command. Inject into system prompt. Done.
```

And when an agent marks something complete, it's logged — with a trace, an actor, a timestamp. The audit trail is automatic.

```bash
rkit issue complete ISSUE-0041 --actor "agent:claude" --message "Token rotation implemented"
# → issue status updated
# → trace emitted
# → next issue unblocked
# → git staged, ready for your commit
```

---

## Rules that run

You write constraints once. Every agent that works in your codebase respects them — enforced by git hooks, not trust.

```yaml
# In any project, spec or issue frontmatter
rules:
  - trigger: before_edit
    instruction: >
      Use defineMappedTable from @justwant/db.
      camelCase in TypeScript, snake_case in DB. No exceptions.
  - trigger: before_complete
    instruction: >
      Schema must pass drizzle-kit check before this issue is marked done.
```

The `pre-commit` hook runs `rkit lint` on every commit touching `.roadkit/`. It doesn't matter if a human or an agent wrote the files — the hook doesn't care.

---

## What it looks like day to day

A solo dev building a SaaS with AI agents:

```
Morning: rkit next
→ shows what to work on, in priority order, with context

During the day: agents execute issues, emit traces, advance state

Evening: git add .roadkit/ && git commit -m "Auth milestone done"
→ code and decisions, versioned together
```

Six months later, a new developer (or a new agent) joins the project:

```bash
rkit history --global
# Full timeline. Every change, who made it, when, why.

rkit context --project PROJ-0001
# The full picture: milestones, issues, the specs that shaped them,
# every issue completed, every agent that touched it.
```

---

## Not just for solo devs

**Small teams without a PM** — roadkit is the shared operational brain. Everyone knows what's in progress, what's blocked, and why decisions were made. No standup required to answer "wait, why did we use that library?".

**Open source projects** — contributors, human or AI, get full context before they touch anything. No more "I rewrote this without knowing it was tied to PROJ-0005".

**Client work** — deliver the codebase and the reasoning behind it. The handoff document writes itself.

---

## Syncs with your existing tools

roadkit lives in git. But if you use Linear or GitHub Issues, it syncs there too — delegating auth entirely to the CLIs you already have authenticated.

```bash
rkit sync linear    # requires: linear CLI authenticated
rkit sync github    # requires: gh auth login
```

---

## Install

```bash
npm install -g roadkit
```

```bash
cd your-project
rkit init
# → roadfig.yml created
# → git hooks installed
# → ready
```

---

## The spec

roadkit is fully documented in the [Founding Paper](./docs/founding-paper.md). Every design decision is recorded there.

---

*Built by [@elydelva](https://github.com/elydelva). Early stage. Feedback welcome.*
