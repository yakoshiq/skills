---
name: essential-comments
description: Add, keep, or remove code comments so only remarks that help humans remain - why, invariants, tradeoffs, and external constraints - not narration or restated code. Use when cleaning noisy comments, writing new code, reviewing comment quality, or when the user wants fewer/better comments.
---

# Essential Comments

A comment earns its place only if a human would lose real context without it.

Match the repo's comment/doc idioms. Never require JSDoc/docstrings or invent a doc system.

## Choose scope

- **Review:** findings only. Noise to delete, missing whys to add; cite symbol and human risk.
- **Edit:** comments only. Same behavior, structure, names, and APIs.

## Keep or add

Only when names and code do not already say it:

- **Why / policy** - intentional tradeoff, partial success, deliberate swallow
- **Invariant / ordering** - concurrency, sequence, non-obvious control flow
- **External / non-local** - vendor quirk, ticket, runbook, magic value whose meaning lives elsewhere

When tightening a good comment, preserve concrete facts (thresholds, ticket IDs, runbook names).

After you write or edit logic, scan once for why / invariant / external facts you actually know (task, ticket, surrounding code) that a later reader cannot recover from names alone. If you know one, add one short comment. Do not guess. If unsure, omit.

## Remove

- Narration or English restatement of the next line, name, type, or clear flag
- Docs that only echo identifiers and parameters
- AI / changelog residue and commented-out code (unless the user wants it kept)
- Meta banners; policies or caller roles not evidenced in visible code
- Duplicate decoding of the same magic (at most one short legend at the definition)

## Discipline

- Why, not what. If unsure, omit.
- A comment papering over a bad name is a naming issue: say so in review; in comments-only edit, do not rename and do not keep pure narration as a stand-in.
- Ship the diff or findings - no essay.
