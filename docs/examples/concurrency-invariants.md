# concurrency-invariants - before / after

The worker consumes an at-least-once queue:

> Make order charging safe under duplicate delivery, concurrent workers, payment timeouts, worker crashes, and event publication failure.

The required guarantee is not "the function usually runs once." It is:

- one logical order causes at most one provider charge;
- only the current owner may commit order state;
- once order state is marked charged, its follow-up event is durable in the same local commit;
- timeout does not mean the provider did nothing.

## Starting point

```ts
const activeOrders = new Set<string>();

export async function processOrder(orderId: string, deps: Deps) {
  if (activeOrders.has(orderId)) return { kind: "busy" };
  activeOrders.add(orderId);

  try {
    const order = await deps.orders.get(orderId);
    if (!order || order.status === "charged") return { kind: "skipped" };

    let charge: { id: string } | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        charge = await deps.payments.charge({
          orderId,
          idempotencyKey: `${orderId}:${Date.now()}:${attempt}`,
          signal: deps.signal,
        });
        break;
      } catch {
        if (attempt === 2) return { kind: "payment_failed" };
      }
    }

    await deps.orders.markCharged(orderId, charge!.id);
    await deps.events.publish({ type: "order_charged", orderId });
    return { kind: "completed", chargeId: charge!.id };
  } finally {
    activeOrders.delete(orderId);
  }
}
```

The process-local set prevents overlap only inside this process. Every retry uses a new provider key. The local state write and event publication are a best-effort dual write.

## Without the skill - one mechanism becomes the whole fix

A common patch stabilizes the payment key:

```diff
+ const idempotencyKey = `charge:${orderId}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    charge = await deps.payments.charge({
      orderId,
-     idempotencyKey: `${orderId}:${Date.now()}:${attempt}`,
+     idempotencyKey,
      signal: deps.signal,
    });
  }
```

This is necessary, but it does not complete the requested guarantee:

- another process has a different `activeOrders` set;
- a lease owner can expire while its remote call is still running;
- a stale worker can overwrite state after takeover;
- a timeout can happen after the provider accepted the charge;
- a crash can happen between charge and local commit;
- publication failure leaves a charged order with no durable event.

The patch improved replay safety at one owner. It did not define the other ownership and commit boundaries.

## With the skill - build the contract first

| Contract question | Decision |
| --- | --- |
| Guarantee | At most one provider charge per order |
| State owner | The shared order store owns claims, fencing, order state, and outbox state |
| Remote effect owner | The payment provider deduplicates `charge:<orderId>` |
| Local commit point | Charged state and pending event commit atomically |
| Ordering | Same-order work is fenced; different orders may run in parallel |
| Timeout | Provider outcome is unknown until queried with the same identity |
| Partial success | Provider charge confirmed, order state unknown; or order charged, event pending |
| Cancellation | Before charge, release the owned claim; during charge, keep the outcome unknown and retry the queue delivery after the lease expires |

The implementation now has seams that enforce those decisions:

```ts
type Claim = {
  orderId: string;
  workerId: string;
  fence: number;
  leaseExpiresAt: number;
};

type ChargeOutcome =
  | { kind: "charged"; chargeId: string }
  | { kind: "declined" }
  | { kind: "unknown" };

type ProcessResult =
  | { kind: "committed"; chargeId: string; event: "pending" }
  | { kind: "skipped"; reason: "missing" | "already_charged" | "busy" }
  | { kind: "failed"; reason: "payment_declined" }
  | {
      kind: "partial";
      charge: "unknown" | "confirmed";
      order: "unknown";
      recovery: "retry_delivery";
    };

interface OrderStore {
  // The store reclaims expired leases and increments the fence.
  claim(
    orderId: string,
    workerId: string,
    leaseForMs: number,
  ): Promise<
    | { kind: "acquired"; claim: Claim }
    | { kind: "missing" | "already_charged" | "busy" }
  >;
  release(claim: Claim): Promise<boolean>;
  commitChargedAndEnqueue(
    claim: Claim,
    chargeId: string,
    event: { id: string; type: "order_charged"; orderId: string },
  ): Promise<"committed" | "stale_owner">;
}

interface Payments {
  charge(
    orderId: string,
    idempotencyKey: string,
    signal: AbortSignal,
  ): Promise<ChargeOutcome>;
  findByIdempotencyKey(
    idempotencyKey: string,
    signal: AbortSignal,
  ): Promise<{ chargeId: string } | undefined>;
}
```

The worker uses stable identity at the provider and a fence at the local commit:

```ts
export async function processOrder(
  orderId: string,
  deps: {
    workerId: string;
    orders: OrderStore;
    payments: Payments;
    signal: AbortSignal;
  },
): Promise<ProcessResult> {
  const claimed = await deps.orders.claim(
    orderId,
    deps.workerId,
    30_000,
  );
  if (claimed.kind !== "acquired") {
    return { kind: "skipped", reason: claimed.kind };
  }

  const { claim } = claimed;
  if (deps.signal.aborted) {
    await deps.orders.release(claim);
    throw deps.signal.reason;
  }

  const chargeKey = `charge:${orderId}`;
  let outcome = await deps.payments.charge(
    orderId,
    chargeKey,
    deps.signal,
  );

  if (outcome.kind === "unknown") {
    const existing = await deps.payments.findByIdempotencyKey(
      chargeKey,
      deps.signal,
    );
    if (!existing) {
      return {
        kind: "partial",
        charge: "unknown",
        order: "unknown",
        recovery: "retry_delivery",
      };
    }
    outcome = { kind: "charged", chargeId: existing.chargeId };
  }

  if (outcome.kind === "declined") {
    await deps.orders.release(claim);
    return { kind: "failed", reason: "payment_declined" };
  }

  const committed = await deps.orders.commitChargedAndEnqueue(
    claim,
    outcome.chargeId,
    {
      id: `order-charged:${orderId}`,
      type: "order_charged",
      orderId,
    },
  );

  if (committed === "stale_owner") {
    return {
      kind: "partial",
      charge: "confirmed",
      order: "unknown",
      recovery: "retry_delivery",
    };
  }

  return {
    kind: "committed",
    chargeId: outcome.chargeId,
    event: "pending",
  };
}
```

A `partial` result is a queue outcome, not an in-memory recovery record. The caller does not acknowledge the job, so the durable queue redelivers it after the bounded claim lease expires. `claim` then issues a higher fence. The next worker queries or retries the provider with the same charge key before attempting the local commit. A gateway adapter maps timeout, cancellation during the call, and lost responses to `unknown`; it never maps them to "not charged."

The pending event is published by an outbox worker. If publication fails, the durable row remains pending instead of disappearing between two unrelated writes.

## Verification follows the failure cuts

Focused tests use barriers and fake clocks, not sleeps:

| Schedule | Assertion |
| --- | --- |
| Two workers claim the same order | One owner proceeds; one provider effect |
| Provider accepts, response is lost | Retry/query uses the same `charge:<orderId>` key |
| Lease expires during charge | New owner takes over; stale fence cannot commit |
| Charge succeeds before local commit | Result exposes confirmed charge, unknown order state, and queue redelivery |
| Event publication fails | Order remains charged and outbox event remains pending |
| Cancellation before charge | Current claim is released; provider is not called |
| Cancellation during charge | Gateway reports unknown; unacknowledged job retries after lease expiry |

The mechanisms are not the contract. The contract explains why stable provider identity, shared ownership, fencing, an atomic local commit, and durable pending work are all required at different boundaries.
