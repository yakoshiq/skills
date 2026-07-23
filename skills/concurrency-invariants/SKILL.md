---
name: concurrency-invariants
description: Design, fix, or review concurrent and asynchronous code so atomicity, ordering, retries, idempotency, cancellation, timeouts, ownership, and partial success are explicit. Use for queues, workers, transactions, event handlers, parallel tasks, scheduled jobs, WebSocket/SSE, repeated delivery, concurrent requests, and race-condition fixes.
---

# Concurrency Invariants

Name the guarantee before choosing a mutex, retry, transaction, lease, or idempotency key. Match the repo's architecture; do not force a framework or clarity-first redesign.

## Choose scope

- **Review:** findings only. Give a possible interleaving and observable impact, not `there may be a race`.
- **Fix / design:** enforce every live part of the contract below. Preserve APIs and local shape unless the guarantee requires a new seam; disclose it.

## Build the contract before editing

Answer only what is live, but inspect every line:

1. **Guarantee:** What must be impossible or remain true?
2. **Ownership:** Which component owns each state and effect? Is coordination process-local, shared, or remote?
3. **Commit points:** What changes atomically? Which effects cannot share that boundary?
4. **Replay:** What can run again? What stable identity follows one logical operation to the owner that deduplicates it?
5. **Scheduling:** What may overlap or reorder? What needs per-key serialization or fencing?
6. **Interruption:** At each timeout, cancellation, or failure boundary, what may already have happened? What is pending, and who resumes or compensates?

A timeout or lost response is an unknown outcome unless the API proves the effect was not applied. Name only guarantees the mechanisms really provide.

## Enforce every boundary

- Inside one owned store, use its transaction, compare-and-set, or uniqueness primitive when needed.
- A process-local lock protects one process. Shared leases need owner tokens or fencing so stale owners cannot commit after takeover.
- A local lock or transaction does not own a remote effect. Give replayable effects stable identity at the owner and reconcile unknown outcomes with that same identity.
- If one effect commits before another can happen, persist the pending work or compensation with the commit. Expose partial success instead of reporting that nothing happened.
- Retry only replay-safe, classified transient failures. Propagate cancellation to owned work; releasing local ownership does not determine a remote outcome.

One mechanism cannot satisfy guarantees across different owners. Do not stop after fixing the first race.

## Completion gate

Before shipping, challenge the result with duplicate delivery, concurrent attempts, allowed reordering, timeout/cancellation around every commit point, failure between effects, and stale-owner completion. If a requested guarantee still depends on timing luck or an undocumented recovery path, the fix is incomplete.

Use deterministic barriers, controlled futures, or fake clocks, not real sleeps. Assert visible state and effect counts. Ship the fix or findings, focused checks, and any guarantee the existing seam cannot provide - no checklist dump.
