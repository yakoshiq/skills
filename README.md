# Skills

Personal catalog of agent skills, installable via [skills.sh](https://skills.sh).

Each skill lives under `skills/<name>/SKILL.md` ([Agent Skills](https://agentskills.io/) format).

## Install

```bash
npx skills add yakoshiq/skills
```

List without installing:

```bash
npx skills add yakoshiq/skills --list
```

One skill:

```bash
npx skills add yakoshiq/skills --skill jane-street-style
```

Global (all projects):

```bash
npx skills add yakoshiq/skills -g
```

After install, prefer an **explicit** invoke (`/skill:jane-street-style` or "use jane-street-style"). Catalog auto-trigger from the description alone is model-dependent.

## Skills

| Skill | Description |
| --- | --- |
| [`jane-street-style`](./skills/jane-street-style/SKILL.md) | Write, refactor, or review code for semantic clarity: precise domain names, explicit failures and effects, immutable data flow, useful domain types, minimal accidental complexity. [Before / after](./skills/jane-street-style/EXAMPLES.md) (TS, Go, Rust, Python). |

## License

[MIT](./LICENSE)
