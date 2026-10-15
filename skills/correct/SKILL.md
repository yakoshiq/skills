---
name: correct
description: Fix a demonstrated class of recurring mistakes with structural enforcement rather than more reminders. Use only when explicitly asked to prevent repeated corrections, encode a recurring lesson, or use correct - not automatically after every bug or piece of feedback.
---

# Correct

Make the recurring mistake harder to reintroduce at the smallest useful boundary. A longer instruction is not enforcement; an architectural rewrite is not automatically justified.

## Establish the pattern

- Find concrete instances in the current repository's commits, reverts, review comments, or user-provided evidence. Separate the repeated mistake from its different symptoms; a preference or one-off defect is not a proven recurring class.
- Name the observable failure, its shared cause, and the behavior that must remain compatible. If recurrence is unproven, say so and handle the bounded defect instead of inventing a class.
- Use only the authorized project/history scope. Keep private conversations, credentials, machine paths, and incident details out of public rules and examples.

## Choose enforceable prevention

Consider these in order; choose the narrowest effective change and explain when a stronger intervention would cost more than it prevents:

1. **Remove the opportunity.** One authoritative catalog instead of hand-synchronized lists; an actual state owner instead of competing writers; delete an obsolete path that keeps being copied. Do not redesign unrelated modules.
2. **Express the constraint.** Use existing types, schema constraints, visibility, or ownership boundaries to reject the invalid state when practical. Do not add wrappers or a new type framework for appearance.
3. **Reject mechanically.** Reuse lint, build, or CI checks where the mistake can be recognized reliably. Diagnostics should identify the supported replacement. Avoid brittle text matching and unrelated tool infrastructure.
4. **Guard the behavior.** Add or repair a focused regression at the boundary where the recurring mistake hurts a consumer. A green test that misses that failure is not prevention.
5. **Keep judgment explicit.** Use a concise instruction or example for choices that cannot be mechanically decided. Do not claim that prose prevents the error, or enforce a subjective preference with a misleading check.

Do not retrofit every historical class in one pass. Fix the requested class completely; report unrelated patterns separately. Removing the invalid path may be sufficient without adding a second enforcement mechanism.

## Prove the prevention

- Reproduce a real prior instance or faithful minimal replay. Show that the proposed check rejects the mistake or that the new structure preserves the required outcome where the old structure fails.
- Verify legitimate inputs and a nearby variation of the same mistake so the fix is not a special case for one historical value. Preserve required public contracts and project gates.
- Run the real check or changed path. Distinguish local execution from CI execution; do not claim CI passed merely because the same command can run there. Never mutate production or historical data to stage the proof.
- If evidence, access, or a reliable seam is missing, state exactly what remains unproved. Do not replace a missing check with another confident reminder.

## Leave the repository simpler

Remove superseded paths and redundant reminders only when their intent remains satisfied; retain rationale and judgment rules that still help. Use the repository's existing documentation convention for any enduring constraint and its enforcement location, not a mandatory new rule table.

Report the recurring class and evidence, chosen prevention, observed before/after result, and remaining limitation. No automatic commits, tracker updates, or new workflow.
