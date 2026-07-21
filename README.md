# Skills

[![skills.sh](https://skills.sh/b/yakoshiq/skills)](https://skills.sh/yakoshiq/skills)

Personal catalog of agent skills, installable via [skills.sh](https://skills.sh).

Each skill lives under `skills/<name>/SKILL.md` ([Agent Skills](https://agentskills.io/) format).

Every skill is tested on the models below until results are near-ideal and `SKILL.md` stays as small as possible without losing quality:

- deepseek-v4-flash
- mimo-v2.5
- glm-5.1
- qwen3.7-plus
- minimax-m2.7
- kimi-k2.7-code
- gpt-5.6

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
npx skills add yakoshiq/skills --skill essential-comments
```

Global (all projects):

```bash
npx skills add yakoshiq/skills -g
```

After install, prefer an **explicit** invoke (`/skill:essential-comments` or "use essential-comments"). Catalog auto-trigger from the description alone is model-dependent.

## Skills

| Skill | Description |
| --- | --- |
| [`essential-comments`](./skills/essential-comments/SKILL.md) | Add, keep, or remove comments so only human-useful remarks remain: why, invariants, tradeoffs, external constraints - not narration or restated code. [Before / after](./skills/essential-comments/EXAMPLES.md) (TS, Python, Go). |
| [`jane-street-style`](./skills/jane-street-style/SKILL.md) | Write, refactor, or review code for semantic clarity: precise domain names, explicit failures and effects, immutable data flow, useful domain types, minimal accidental complexity. [Before / after](./skills/jane-street-style/EXAMPLES.md) (TS, Go, Rust, Python). |

## Authoring

- One directory per skill: `skills/<name>/SKILL.md` (required), optional `EXAMPLES.md`.
- Keep `SKILL.md` small: transferable principles, not fixture-specific patches.
- **Basic ASCII only** in skill docs (`SKILL.md`, `EXAMPLES.md`, and this README). No em/en dashes, smart quotes, ellipsis characters, or other non-ASCII punctuation - use `-`, `'`, `...` instead. Code samples stay ASCII unless a language genuinely requires otherwise.
- Do not commit eval harnesses or run logs.

## License

[MIT](./LICENSE)
