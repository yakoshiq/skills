# essential-comments - before / after

Two jobs, same skill:

1. **Cleanup** - strip narration and echo-docs; keep real whys.
2. **Greenfield / silent default** - file has no remarks (typical "clean code" agent). When non-local facts are known (task, ticket, runbook), the skill still **adds** short whys. It does not guess.

No JSDoc mandate. No renames (that is a different skill). Snippets show comment shape, not a full module.

---

## 1. Greenfield - silent baseline vs skill

Facts known from the task / ticket (not visible in names alone): `force` is VIP oversell; reserve stock before charge for concurrency; `2000` ms is Stripe + `#1842`.

**Without** (model default: ship bare code)

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

**With** (skill: add only what a later reader would lose)

```ts
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  if (!req.productId || req.qty <= 0) return false;
  const stock = inventory[req.productId] ?? 0;

  // force: ops override for VIP oversell
  if (stock < req.qty && !opts.force) return false;
  if (opts.dryRun) return true;

  // Reserve before charge so concurrent checkouts cannot both pass the
  // stock check; brief over-hold is OK if charge fails and we roll back.
  inventory[req.productId] = stock - req.qty;
  try {
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    inventory[req.productId] = stock;
    return false;
  }

  // Stripe settles ~2s; webhook can race our row (see #1842).
  scheduleConfirm(req.orderId, { afterMs: 2000 });
  return true;
}

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

Still uncommented on purpose: `dryRun` (name is enough), `formatMoney` (obvious arithmetic), the restore assign in `catch` (shape is obvious).

Same idea in Python when the legacy `mode` int and partial-success policy are known:

**Without**

```python
def process(d: dict, flag: bool = True, mode: int = 0):
    uid, amt = d["uid"], d["amt"]
    if mode == 1:
        bal = _wallets.get(uid, 0) + amt
        _wallets[uid] = bal
        if flag:
            send(uid, amt)  # may raise; wallet already credited
        return bal
    ...
```

**With**

```python
def process(d: dict, flag: bool = True, mode: int = 0):
    # mode: 0=noop-ish, 1=credit, 2=debit
    uid, amt = d["uid"], d["amt"]
    if mode == 1:
        bal = _wallets.get(uid, 0) + amt
        _wallets[uid] = bal
        if flag:
            # Provider may fail above 10_000; credit is kept
            # (partial success intentional - billing runbook).
            send(uid, amt)
        return bal
    ...
```

---

## 2. Cleanup - noisy baseline vs skill

### TypeScript

**Without**

```ts
/**
 * Process a checkout request and return whether it succeeded.
 * @param req - the checkout request
 * @returns true if ok
 */
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  // Check if request is valid
  if (!req.productId || req.qty <= 0) return false;

  // Get current stock level
  const stock = inventory[req.productId] ?? 0;

  // Allow oversell only when force is set (ops override for VIP)
  if (stock < req.qty && !opts.force) return false;

  // Dry run: validate only, do not mutate
  if (opts.dryRun) return true;

  // Decrement inventory before charge so two concurrent checkouts
  // cannot both pass the stock check (we accept brief over-hold on charge fail).
  inventory[req.productId] = stock - req.qty; // subtract qty from stock

  try {
    // Charge the user
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    // Rollback inventory on payment failure
    inventory[req.productId] = stock;
    return false; // payment failed
  }

  // Stripe settles in 2s; webhook may arrive before our row is visible.
  // Delay confirm publish so the read model is caught up (see #1842).
  scheduleConfirm(req.orderId, { afterMs: 2000 });

  // Return success
  return true;
}

// Helper to format cents as dollars
export function formatMoney(cents: number): string {
  // Divide by 100 to convert cents to dollars
  return (cents / 100).toFixed(2);
}
```

**With**

```ts
export function handleCheckout(
  req: CheckoutReq,
  opts: { dryRun?: boolean; force?: boolean } = {},
): boolean {
  if (!req.productId || req.qty <= 0) return false;

  const stock = inventory[req.productId] ?? 0;

  // Allow oversell only when force is set (ops override for VIP)
  if (stock < req.qty && !opts.force) return false;

  if (opts.dryRun) return true;

  // Decrement inventory before charge so two concurrent checkouts
  // cannot both pass the stock check (we accept brief over-hold on charge fail).
  inventory[req.productId] = stock - req.qty;

  try {
    charge(req.userId, req.unitPrice * req.qty);
  } catch {
    inventory[req.productId] = stock;
    return false;
  }

  // Stripe settles in 2s; webhook may arrive before our row is visible.
  // Delay confirm publish so the read model is caught up (see #1842).
  scheduleConfirm(req.orderId, { afterMs: 2000 });

  return true;
}

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

### Python

**Without**

```python
def process(d: dict, flag: bool = True, mode: int = 0):
    """Process a wallet operation.

    Args:
        d: the payload dict
        flag: whether to notify
        mode: 0=noop-ish, 1=credit, 2=debit
    """
    try:
        # Get the user id from the dict
        uid = d["uid"]
        amt = d["amt"]

        # Mode 1 means credit
        if mode == 1:
            bal = _wallets.get(uid, 0) + amt
            _wallets[uid] = bal
            if flag:
                # Provider drops silently above 10_000; we still keep the credit
                # (partial success is intentional - see billing runbook).
                send(uid, amt)
            return bal
        ...
    except Exception:
        # Something went wrong
        return False
```

**With**

```python
def process(d: dict, flag: bool = True, mode: int = 0):
    # mode: 0=noop-ish, 1=credit, 2=debit
    try:
        uid = d["uid"]
        amt = d["amt"]

        if mode == 1:
            bal = _wallets.get(uid, 0) + amt
            _wallets[uid] = bal
            if flag:
                # Provider drops silently above 10_000; we still keep the credit
                # (partial success is intentional - see billing runbook).
                send(uid, amt)
            return bal
        ...
    except Exception:
        return False
```

### Go

**Without**

```go
// HandleCheckout processes a checkout request and returns whether it succeeded.
func HandleCheckout(req CheckoutReq, dryRun bool, force bool) bool {
    // Check if request is valid
    if req.ProductID == "" || req.Qty <= 0 {
        return false
    }
    stock := inventory[req.ProductID]
    // Allow oversell only when force is set (ops override for VIP)
    if stock < req.Qty && !force {
        return false
    }
    if dryRun {
        return true
    }
    // Reserve before charge so concurrent checkouts cannot both pass the stock check.
    inventory[req.ProductID] = stock - req.Qty
    if err := Charge(req.UserID, req.UnitPrice*req.Qty); err != nil {
        inventory[req.ProductID] = stock // rollback on payment failure
        return false
    }
    // Stripe settles in 2s; webhook may arrive before our row is visible (#1842).
    ScheduleConfirm(req.OrderID, 2000)
    return true // success
}
```

**With**

```go
func HandleCheckout(req CheckoutReq, dryRun bool, force bool) bool {
    if req.ProductID == "" || req.Qty <= 0 {
        return false
    }
    stock := inventory[req.ProductID]
    // Allow oversell only when force is set (ops override for VIP)
    if stock < req.Qty && !force {
        return false
    }
    if dryRun {
        return true
    }
    // Reserve before charge so concurrent checkouts cannot both pass the stock check.
    inventory[req.ProductID] = stock - req.Qty
    if err := Charge(req.UserID, req.UnitPrice*req.Qty); err != nil {
        inventory[req.ProductID] = stock
        return false
    }
    // Stripe settles in 2s; webhook may arrive before our row is visible (#1842).
    ScheduleConfirm(req.OrderID, 2000)
    return true
}
```

---

## Cheat sheet

| Direction | Do | Don't |
| --- | --- | --- |
| Greenfield | Add VIP/`force`, reserve-before-charge, Stripe `#1842`, partial-success + runbook, one `mode:` legend | Comment `dryRun`, `formatMoney`, obvious restore; invent "admin" |
| Cleanup | Keep the same whys | Narration, echo JSDoc/Args, `// payment failed`, per-branch mode labels |
