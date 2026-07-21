<a href="https://github.com/yakoshiq/skills">
  <img src="assets/banner.png" alt="Skills for intentional code" width="840" />
</a>

# Skills for intentional code

[![skills.sh](https://skills.sh/b/yakoshiq/skills)](https://skills.sh/yakoshiq/skills)

Agent skills that push toward code humans can review: clear domain meaning, honest failures, and comments only when they earn their place.

Default agent output often looks finished and still hides the hard parts - vague names, one `false` for every failure, narration comments, missing whys. These skills are short on purpose. Each one is exercised on several models until the result is near-ideal and the skill file stays small:

deepseek-v4-flash, mimo-v2.5, glm-5.1, qwen3.7-plus, minimax-m2.7, kimi-k2.7-code, gpt-5.6.

## Install

```bash
npx skills add yakoshiq/skills
```

One skill:

```bash
npx skills add yakoshiq/skills --skill essential-comments
```

Global:

```bash
npx skills add yakoshiq/skills -g
```

Prefer an explicit invoke (`/skill:essential-comments` or "use essential-comments"). Auto-trigger from the description alone depends on the model.

## Reference

- **[essential-comments](./skills/essential-comments/SKILL.md)** - Add, keep, or remove comments so only human-useful remarks remain: why, invariants, tradeoffs, external constraints - not narration or restated code. Works as cleanup and when writing new code. [Before / after](./skills/essential-comments/EXAMPLES.md).
- **[jane-street-style](./skills/jane-street-style/SKILL.md)** - Write, refactor, or review for semantic clarity: precise domain names, explicit failures and effects, immutable data flow where it helps, useful domain types, minimal accidental complexity. [Before / after](./skills/jane-street-style/EXAMPLES.md).

## License

[MIT](./LICENSE)
