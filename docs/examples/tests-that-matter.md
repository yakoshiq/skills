# tests-that-matter - before / after

The task is tests only:

> Improve confidence in `processTransfer` without changing production behavior.

The production contract is already fixed:

```ts
type TransferResult =
  | { ok: true }
  | { ok: false; error: "validation_error" }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "notify_failed"; committed: true };
```

A transfer debits one wallet, credits another, then notifies an external provider. Notification can fail after both balances commit. The repository owns wallet persistence, so tests can use an in-memory fake. The provider is an external edge, so a narrow mock is appropriate.

## Without the skill - green without confidence

```ts
it("processTransfer calls its dependencies", async () => {
  const wallets = {
    get: vi.fn(),
    save: vi.fn(),
  };
  const notify = vi.fn();

  wallets.get.mockResolvedValue({ id: "w1", balance: 100 });

  await processTransfer(
    { from: "w1", to: "w2", amount: 40 },
    { wallets, notify },
  );

  expect(wallets.get).toHaveBeenCalledWith("w1");
  expect(wallets.save).toHaveBeenCalled();
  expect(notify).toHaveBeenCalled();
});
```

This test can stay green when important behavior is broken:

- the wrong amount could move;
- only one balance could be saved;
- the result could report failure;
- notification could contain the wrong transfer;
- notification failure could accidentally roll back committed balances;
- validation and missing-wallet failures could collapse together.

It verifies the shape of one implementation, not the contract a caller or operator observes.

## With the skill - prove outcomes and boundaries

### Successful transfer

```ts
it("moves balances and notifies the provider", async () => {
  const wallets = memoryWallets({ w1: 100, w2: 10 });
  const notify = vi.fn().mockResolvedValue(undefined);

  const result = await processTransfer(
    { from: "w1", to: "w2", amount: 40 },
    { wallets, notify },
  );

  expect(result).toEqual({ ok: true });
  expect(wallets.snapshot()).toEqual({ w1: 60, w2: 50 });
  expect(notify).toHaveBeenCalledWith({
    from: "w1",
    to: "w2",
    amount: 40,
  });
});
```

The state assertion proves the domain outcome. The call assertion proves the real external boundary. Neither replaces the other.

### Distinct failures

```ts
it("rejects a non-positive amount without changing balances", async () => {
  const wallets = memoryWallets({ w1: 100, w2: 10 });
  const notify = vi.fn();

  const result = await processTransfer(
    { from: "w1", to: "w2", amount: 0 },
    { wallets, notify },
  );

  expect(result).toEqual({ ok: false, error: "validation_error" });
  expect(wallets.snapshot()).toEqual({ w1: 100, w2: 10 });
  expect(notify).not.toHaveBeenCalled();
});

it("returns not_found when the source wallet is missing", async () => {
  const wallets = memoryWallets({ w2: 10 });
  const notify = vi.fn();

  const result = await processTransfer(
    { from: "missing", to: "w2", amount: 40 },
    { wallets, notify },
  );

  expect(result).toEqual({ ok: false, error: "not_found" });
  expect(wallets.snapshot()).toEqual({ w2: 10 });
  expect(notify).not.toHaveBeenCalled();
});
```

Both cases are failures, but they protect different policies. `expect(result.ok).toBe(false)` would hide that distinction.

### Partial success

```ts
it("keeps committed balances when notification fails", async () => {
  const wallets = memoryWallets({ w1: 100, w2: 10 });
  const notify = vi.fn().mockRejectedValue(new Error("provider down"));

  const result = await processTransfer(
    { from: "w1", to: "w2", amount: 40 },
    { wallets, notify },
  );

  expect(result).toEqual({
    ok: false,
    error: "notify_failed",
    committed: true,
  });
  expect(wallets.snapshot()).toEqual({ w1: 60, w2: 50 });
  expect(notify).toHaveBeenCalledWith({
    from: "w1",
    to: "w2",
    amount: 40,
  });
});
```

The result and state must be asserted together. Checking only `notify` rejection misses the committed transfer; checking only balances misses the operational failure.

## What confidence each test adds

| Case | Observable contract | Regression caught |
| --- | --- | --- |
| Success | result, both balances, provider payload | wrong amount, one-sided write, missing or malformed notification |
| Invalid amount | exact error, unchanged state, no notification | validation after mutation, collapsed error |
| Missing source | exact error, unchanged state, no notification | accidental wallet creation, collapsed error |
| Notify failure | exact partial-success result and committed state | hidden commit or invented rollback |

`memoryWallets` is a fake for an owned stateful collaborator. `notify` is mocked because it is the external edge. The tests do not assert private helper calls or internal save order.

## A regression must fail before the fix

Suppose `feeCents` used `Math.floor`, making small transfers free:

```ts
export function feeCents(amount: number): number {
  return Math.floor(amount * 0.01);
}
```

This looks relevant but stays green on the defect:

```ts
it("applies a fee", () => {
  expect(feeCents(1000)).toBeGreaterThan(0);
});
```

The focused boundary case fails before the fix:

```ts
it("charges at least one cent below the percentage step", () => {
  expect(feeCents(99)).toBe(1);
});
```

A regression test that also passes on the broken implementation is only documentation.

## Repeated examples should state one rule

Five copied tests make the policy harder to scan:

```ts
it("accepts 1", () => expect(parseQty("1")).toBe(1));
it("accepts 2", () => expect(parseQty("2")).toBe(2));
it("accepts 10", () => expect(parseQty("10")).toBe(10));
it("rejects 0", () => expect(parseQty("0")).toBeNull());
it("rejects -1", () => expect(parseQty("-1")).toBeNull());
```

One table exposes the meaningful boundaries:

```ts
it.each([
  ["1", 1],
  ["10", 10],
  ["0", null],
  ["-1", null],
  ["x", null],
])("parseQty(%j) -> %j", (raw, expected) => {
  expect(parseQty(raw)).toBe(expected);
});
```

The goal is not fewer tests at any cost. It is fewer tests whose assertions each protect an observable behavior, failure mode, invariant, or boundary that can actually regress.
