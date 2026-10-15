---
name: verification-planning
description: Plan and carry out acceptance checks across runtime boundaries, or recover verification stuck in repeated runs or unclear results. Use for acceptance plans, multi-service verification, evidence reuse, and deciding what remains unproved - not routine test authoring, every small fix, or root-cause debugging.
---

# Verification Planning

Prove the agreed result with sufficient evidence, not the largest number of runs. Follow the project's required checks and the user's acceptance criteria; efficiency never waives them.

## Bound the proof

- Identify the requested outcomes, required checks, and explicit exclusions. Do not invent an open-ended audit or substitute an easier subset.
- For each outcome, name the boundary and observation that would prove it. A component test, real-store integration, runtime smoke, and live-provider run establish different claims.
- Check the actual environment and operation permissions before planning work that needs them. Missing access is a named gap, not permission to call a controlled substitute live evidence.

## Choose the next useful check

- Reuse trustworthy evidence for the same relevant state. Record the command or scenario, result, code state including local changes, material environment, and artifact location. A commit alone does not identify a dirty working tree.
- Repeat a check when relevant code, dependencies, environment, new risk, or unreliable evidence invalidates its result - not merely because the task is ending. Unrelated changes do not automatically invalidate every result.
- Share setup and batch independent work when safe. Use focused checks during changes and the required integrated checks on the final state; do not multiply identical full runs across owners.
- Never waive an explicitly required fresh run or project gate on the strength of an older or narrower result. Name unrun checks and what they leave unproved.
- For a risky change, state its key safety premise and trace downstream persisted, wire, or runtime consumers beyond symbol references. Prove the premise at a meaningful real-code boundary, scaling the boundary to the risk and available access; label any part not proved. This is not a new script or phase for every fix.

## Observe the lifecycle

- Distinguish a terminating command, a long-lived service, and a wait for external input. Service readiness is not process exit or end-to-end success; use the ready service to exercise the required path.
- When progress stalls, inspect the available result, logs, activity, and prerequisites before waiting longer or restarting. A consumed one-shot event need not arrive twice; verify its recorded effect.
- Reconcile an unknown external effect before repeating a mutation. Timeout is not proof that nothing happened. Keep existing authorization and safety boundaries.

## Finish on evidence

Every agreed outcome must have current evidence at its required boundary before being called complete. If a required check is blocked or failed, finish reachable work and report the exact gap; do not label the overall acceptance passed.

Stop after the agreed proof is complete. A newly discovered material defect needs correction or explicit disclosure, not a silent scope reduction or an endless adjacent-improvement hunt.

Report the result, evidence boundaries, and remaining gaps briefly. Use `tests-that-matter` for test quality and `surgical-changes` for the change boundary; this skill does not add a tracker workflow or prescribe agent models.
