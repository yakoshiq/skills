# essential-comments - before / after

The task is to ship a checkout path. The code is already readable, but the ticket carries three facts that names alone cannot recover:

- `force` is an operations override for VIP oversell.
- Inventory must be reserved before charging so concurrent checkouts cannot both pass the stock check. A brief over-hold is acceptable because charge failure restores stock.
- Confirmation waits 2000 ms because the Stripe webhook can race the read model (`#1842`).

The ticket says nothing special about `dryRun`, money formatting, or the obvious restore assignment.

## Without the skill - useful context disappears

A clean-looking implementation may contain no comments at all:

```ts
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  if (!req.productId || req.qty <= 0) return false;

  const stock = inventory[req.productId] ?? 0;
  if (stock < req.qty && !opts.force) return false;
  if (opts.dryRun) return true;

  inventory[req.productId] = stock - req.qty;
  try {
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    inventory[req.productId] = stock;
    return false;
  }

  scheduleConfirm(req.orderId, { afterMs: 2000 });
  return true;
}

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

The control flow is visible, but the policy and external constraints are not. A later maintainer can easily "simplify" the reserve order, remove the delay, or assume `force` is a generic bypass.

## With the skill - add only what a human would lose

```ts
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  if (!req.productId || req.qty <= 0) return false;

  const stock = inventory[req.productId] ?? 0;

  // force is the operations override for VIP oversell.
  if (stock < req.qty && !opts.force) return false;
  if (opts.dryRun) return true;

  // Reserve before charge so concurrent checkouts cannot both pass the
  // stock check. Charge failure restores the accepted brief over-hold.
  inventory[req.productId] = stock - req.qty;
  try {
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    inventory[req.productId] = stock;
    return false;
  }

  // Stripe webhook delivery can race the read model; see #1842.
  scheduleConfirm(req.orderId, { afterMs: 2000 });
  return true;
}

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

Production behavior, names, structure, and APIs are unchanged. Only three non-local facts were added.

| Comment | Why it earns its place |
| --- | --- |
| VIP oversell | Defines policy and who owns the override |
| Reserve before charge | Protects a concurrency invariant and explains the rollback tradeoff |
| Stripe race and `#1842` | Records an external timing constraint and its source |

Still uncommented on purpose:

- `dryRun` already says what it does.
- `formatMoney` is obvious arithmetic.
- restoring `inventory[req.productId] = stock` is visible in the `catch`.
- validation and `return true` do not need narration.

## The same skill removes noise

Suppose the same function arrives with generated documentation and line-by-line narration:

```ts
/**
 * Handle a checkout request.
 * @param req The checkout request.
 * @returns Whether checkout succeeded.
 */
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  // Validate the request.
  if (!req.productId || req.qty <= 0) return false;

  // Get the stock.
  const stock = inventory[req.productId] ?? 0;

  // Check whether oversell is allowed.
  if (stock < req.qty && !opts.force) return false;

  // Return early for a dry run.
  if (opts.dryRun) return true;

  // Reserve before charge so concurrent checkouts cannot both pass the
  // stock check. Charge failure restores the accepted brief over-hold.
  inventory[req.productId] = stock - req.qty; // Subtract quantity.

  try {
    // Charge the user.
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    // Restore the stock.
    inventory[req.productId] = stock;
    return false; // Checkout failed.
  }

  // Stripe webhook delivery can race the read model; see #1842.
  scheduleConfirm(req.orderId, { afterMs: 2000 });

  // Return success.
  return true;
}
```

The cleanup is a comment-only change. Delete the echo-docs and narration; retain the reserve-order invariant and Stripe constraint. If the VIP meaning is known from the task, retain that too. Do not rename the function, restructure the flow, or invent a new documentation convention while performing comment cleanup.

## What the skill does not guess

A comment is not a place to manufacture missing context:

```ts
// Admin-only emergency bypass for enterprise customers.
if (stock < req.qty && !opts.force) return false;
```

Nothing in the task established "admin", "emergency", or "enterprise". The honest choice is the known VIP-operations fact, or no comment if that fact is unavailable.

The result is neither "comment everything" nor "comments are a smell." It is a narrow rule: preserve facts a human cannot reconstruct from the code, and remove prose that merely repeats it.
