---
name: tests-that-matter
description: Write or review tests that prove observable behavior, failure semantics, invariants, and boundary cases. Use when adding tests, fixing brittle or mock-heavy tests, reviewing test quality, or when coverage exists but confidence does not.
---

# Tests That Matter

Prove behavior a caller or operator can observe. Green is not confidence.

Match the repo's test runner and style. Do not invent a framework, coverage cult, or TDD ceremony.

## Choose scope

- **Review:** findings only - no rewrite. Weak asserts, mock theater, missing failures/boundaries, false regressions.
- **Write / fix:** add or reshape tests. Touch production only for a real test seam, and say so.
- **New feature work:** when you change invariants or failure paths, update or add the focused cases that prove them.

## Prove

- Public outcomes: return values, raised/returned errors, persisted state, and effects at real external boundaries.
- Map each agreed journey to its required observable outcome and boundary; cover every agreed journey, not just the easiest one. For persistence or asynchronous work, verify the state after rereading it or after completion, not only HTTP 200, a mock call, or a visible button.
- Name what each test boundary proves: an in-memory store does not prove real-store persistence, and a controlled provider does not prove live-provider behavior. Runtime smoke proves only the paths and dependencies actually exercised.
- Distinct failure modes as distinct cases (validation vs not-found vs infra vs partial success). If effect A commits and B fails, assert both the committed state and the failure.
- Invariants and boundaries that can actually break (empty, zero, max, off-by-one, idempotency).
- A regression that fails on the old defect. If it stays green on broken code, it is not a regression test.

## Avoid

- Private helpers, call order inside the unit, and literal structure of the implementation.
- Mocks of implementation details inside the unit. Prefer in-memory fakes for owned stateful collaborators; mock only narrow external or nondeterministic edges (network, clock, disk, queue, payment gateway).
- Asserts that only restate the mock setup (`toHaveBeenCalledWith` with no outcome check).
- Five near-duplicate cases when one table or parameterized rule states the policy.
- Broad snapshots or full-object equality when a few precise fields carry the meaning.
- Flakes: real sleeps, uncontrolled clocks/randomness, test-order dependence, shared mutable fixtures across cases.

## Discipline

- Prefer fewer sharper tests over a pile of weak ones.
- Keep permanent tests for plausible regressions, not merely to demonstrate that code is wired or that a suite exists. This does not reduce required acceptance coverage.
- Name tests by the behavior or risk they guard, not by the method under test alone.
- If a test can stay green while the bug returns, delete or rewrite it.
- Meet repo coverage gates when they exist; optimize for confidence, not percentage.
- Ship tests plus a brief note of what confidence they add - no essay.
