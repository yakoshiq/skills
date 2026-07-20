---
name: jane-street-style
description: Write, refactor, or review code for semantic clarity using precise domain names, explicit failures and effects, immutable data flow, useful domain types, and minimal accidental complexity. Use for Jane Street or house style, intentional code, vague naming, hidden failures, primitive obsession, mutation-heavy code, or unnecessary abstraction.
---

# Clarity-First Code

Make code easy to review and hard to misuse. Follow the target language and repo idioms; do not transplant OCaml patterns or add a functional framework.

## Choose scope

- **Review:** findings only - no rewrite. Correctness and failure semantics first; then whether names reveal the domain action.
- **Refactor:** keep observable behavior and public call-shape by default. Clear domain API in the core; old entry points stay as thin adapters that preserve legacy results and effect order. Disclose any break.
- **New code / redesign:** clearest domain API, no legacy drag.

Never call a behavior change a refactor. Disclose material changes to APIs, validation, effect ordering, or failure semantics.

## Apply in order

1. Name the domain operation, invariants, effects, and expected failures.
2. Shortest precise domain names. Treat `process`, `handle`, `update`, `run`, `execute`, `init` as review signals, not bans; keep conventional terms when exact.
3. Prefer immutable values and pure transforms; keep localized mutation when clearer, idiomatic, or hot.
4. Native errors with context. Do not collapse validation, infrastructure, and programmer failures into one sentinel. If effect A commits and effect B fails, that is **partial success** - expose both on the new API (e.g. balance changed, notify failed). During a behavior-preserving refactor, do not invent rollback or fold that into `false`/`None` unless the policy change is intentional and disclosed.
5. Types only to block plausible confusion or invalid states. Variants for modes with different data. Named booleans OK when both meanings are obvious; no ambiguous behavior-changing flag soup; no primitive-wrapper ceremony.
6. Separate decisions from effects at useful boundaries. Delete abstractions that enforce no invariant, isolate no policy or effect, and remove no real duplication.

Compatibility stays at the boundary: parse legacy strings/bools/primitives into richer internals when that prevents invalid states. Adapters wrap the core - they do not reshape legacy observables. Richer failures belong on new APIs, not silently inside old ones.

Native patterns only - TS discriminated unions and `unknown`, Go `(value, error)`, Python exceptions, Rust `Result` and enums. Reuse project conventions before introducing result types or frameworks.

Small diff: one obvious domain core, thin adapters, no helper sprawl. Preserve effect order unless you intentionally change it. Update focused tests for changed invariants or failure paths. Ship production code plus a brief disclosure of material tradeoffs or compatibility choices.
