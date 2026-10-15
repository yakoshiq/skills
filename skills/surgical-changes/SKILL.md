---
name: surgical-changes
description: Implement fixes and small features as the smallest coherent change that fully solves the requested problem. Use when scope control, behavioral preservation, reviewability, or avoiding opportunistic cleanup matters.
---

# Surgical Changes

Solve the requested problem completely, with no unrelated improvement hidden in the diff. Smallest coherent change means the narrowest correct change, not the fewest edited lines or a patch over the symptom.

## Set the boundary

Before editing, identify:

- the observable bug or requested outcome;
- the symbols, tests, and boundary that must change;
- the behavior that must remain unchanged.

Classify each contemplated edit:

1. **Required** - directly fixes or implements the request.
2. **Coupled** - needed so the required change compiles, remains correct, or can be tested at the nearest meaningful boundary.
3. **Adjacent** - useful cleanup or another defect, but not causally necessary.

Only required and coupled edits belong in the diff. If you cannot explain why a hunk is needed for the request, leave it out.

If repeated fixes fail at the same gate and share a premise, check that premise with a discriminating test or observation before patching again. Do not hard-stop after an arbitrary number of failures or redesign the whole system; continue useful independent work.

## Change only what the cause requires

- Follow local names, control flow, error style, types, and test idioms, even when you would choose differently in new code.
- Fix the root cause within the established boundary. Do not duplicate policy or add a brittle special case merely to minimize line count.
- Preserve public call-shape, defaults, return values, failure semantics, effect order, and serialization unless the request requires changing them.
- Do not rename or move neighboring code, reformat untouched regions, introduce an abstraction or dependency, tighten unrelated types, or rewrite nearby errors opportunistically.
- Do not mix feature work, refactoring, and cleanup. If a supporting refactor is necessary, keep it to the smallest enabling step and state why it is coupled.

## Verify the seam

- For a bug, use meaningful existing or new regression coverage that catches the original failure; add a permanent test when important behavior is not already covered. For a feature, verify the changed contract and meaningful boundaries, not just argument wiring.
- A repository's test suite alone does not require a new permanent test. A concrete runtime scenario or temporary probe can be sufficient when it proves the behavior; say what it established. Keep all required project checks and explicitly requested acceptance gates.
- Exercise the changed path at the nearest boundary where its behavior is observable; do not broaden into a test-suite redesign.
- Reuse valid verification evidence when the checked state and relevant environment have not changed. Rerun when relevant changes, new risk, unreliable evidence, or an explicit fresh-run gate require it. Preserve a smoke check at the nearest observable boundary when required to prove the changed path.
- Run required and relevant checks, then inspect the final diff. Every hunk should trace back to the request.

## Keep discoveries out of the diff

Report adjacent defects or cleanup opportunities separately with a path or symbol and a brief impact. Do not fix them without the user expanding scope.

Ship the change, focused verification, and any separate follow-up notes - no unrelated polish.
