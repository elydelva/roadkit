# roadkit

> *Git tracks what changed. roadkit tracks why.*

Decision-first, agent-native project management system that lives inside your git repository. Ships the `rkit` CLI.

## Install

```bash
npm install -g roadkit
```

## Quick start

```bash
cd your-project
rkit init

rkit project new --title "Auth overhaul"
rkit milestone new --project PROJ-0001 --title "JWT + refresh tokens"
rkit issue add --milestone MILE-0001 --title "Implement token rotation"
rkit spec new --project PROJ-0001 --title "Switch auth to JWT"

rkit context --active | pbcopy   # paste into your agent
rkit next                         # what to work on next
```

## Documentation

Full documentation in the [GitHub repository](https://github.com/elydelva/roadkit).

## License

MIT
