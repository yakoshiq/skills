---
name: jane-street-style
description: Design, refactor, or review code when semantic clarity is the explicit goal, using precise domain names, explicit failures and effects, useful domain types, immutable data flow, and minimal accidental complexity. Use for Jane Street or clarity-first redesign, vague domain APIs, collapsed failures, primitive obsession, or mutation-heavy code - not ordinary bug fixes that should preserve local shape.
---

# Clarity-First Code

Make code easy to review and hard to misuse. Follow the target language and repo idioms; do not transplant OCaml patterns or add a functional framework.

## Choose scope

- **Review:** findings only - no rewrite. Correctness and failure semantics first; then whether names reveal the domain action.
- **Refactor:** keep observable behavior and public call-shape by default. If backward compatibility is required, preserve the old entry point as a thin adapter that keeps legacy results and effect order. If an approved clean cutover is intended, migrate affected callers and remove the obsolete entry point without a shim. Never silently break a preserved public contract or call a behavior change a refactor.
- **New code / redesign:** clearest domain API, no legacy drag.

Never call a behavior change a refactor. Disclose material changes to APIs, validation, effect ordering, or failure semantics.

## Apply in order

1. Name the domain operation, invariants, effects, and expected failures.
2. Shortest precise domain names. Treat `process`, `handle`, `update`, `run`, `execute`, `init` as review signals, not bans; keep conventional terms when exact.
3. Prefer immutable values and pure transforms; keep localized mutation when clearer, idiomatic, or hot.
4. Native errors with context. Do not collapse validation, infrastructure, and programmer failures into one sentinel. If effect A commits and effect B fails, that is **partial success** - expose both on the new API (e.g. balance changed, notify failed). During a behavior-preserving refactor, do not invent rollback or fold that into `false`/`None` unless the policy change is intentional and disclosed.
5. Types only to block plausible confusion or invalid states. Variants for modes with different data. Named booleans OK when both meanings are obvious; no ambiguous behavior-changing flag soup; no primitive-wrapper ceremony.
6. Separate decisions from effects at useful boundaries. Delete abstractions that enforce no invariant, isolate no policy or effect, and remove no real duplication.

For a genuinely new or non-obvious API, first sketch a representative caller and derive the smallest signature and types that make that call clear. This is not required for every local edit; do not force two competing designs or commit a throwaway scaffold.

When compatibility is required, keep it at the boundary: parse legacy strings/bools/primitives into richer internals when that prevents invalid states. Adapters wrap the core - they do not reshape legacy observables. For an approved clean cutover, migrate callers and delete the obsolete entry point instead of retaining an unused adapter. Richer failures belong on new APIs, not silently inside old ones.

Native patterns only - TS discriminated unions and `unknown`, Go `(value, error)`, Python exceptions, Rust `Result` and enums. Reuse project conventions before introducing result types or frameworks.

Small diff: one obvious domain core, adapters only when needed to preserve a required contract, no helper sprawl. Preserve effect order unless you intentionally change it. Update focused tests for changed invariants or failure paths. Ship production code plus a brief disclosure of material tradeoffs or compatibility choices.
