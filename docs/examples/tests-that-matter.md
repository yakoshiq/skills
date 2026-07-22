# tests-that-matter - before / after

Two jobs, same skill:

1. **Review / fix** - strip mock theater and weak asserts; prove outcomes, failures, state.
2. **Greenfield** - from known invariants and failure modes, add the few cases that would catch real bugs.

No arbitrary coverage target. Meet repository gates, but optimize for confidence rather than percentage. No TDD ritual. Snippets show test shape, not a full suite.

---

## 1. Mock theater -> observable outcomes

Service moves balances, then notifies. Notify can fail after the transfer commits (partial success). API shape is a result object throughout.

**Without** (looks thorough, proves little)

```ts
it("processTransfer calls deps in order", async () => {
  const wallets = { get: vi.fn(), save: vi.fn() };
  const notify = vi.fn();
  wallets.get.mockResolvedValue({ id: "w1", balance: 100 });
  await processTransfer({ from: "w1", to: "w2", amount: 40 }, { wallets, notify });
  expect(wallets.get).toHaveBeenCalledWith("w1");
  expect(wallets.save).toHaveBeenCalled();
  expect(notify).toHaveBeenCalled();
});
```

**With** (outcome + boundary effect + partial success)

```ts
it("moves balances and notifies on success", async () => {
  const db = memoryWallets({ w1: 100, w2: 10 });
  const notify = vi.fn().mockResolvedValue(undefined);
  const result = await processTransfer(
    { from: "w1", to: "w2", amount: 40 },
    { wallets: db, notify },
  );
  expect(result).toEqual({ ok: true });
  expect(db.snapshot()).toEqual({ w1: 60, w2: 50 });
  expect(notify).toHaveBeenCalledWith({ from: "w1", to: "w2", amount: 40 });
});

it("keeps committed balances when notify fails after commit", async () => {
  const db = memoryWallets({ w1: 100, w2: 10 });
  const notify = vi.fn().mockRejectedValue(new Error("smtp down"));
  const result = await processTransfer(
    { from: "w1", to: "w2", amount: 40 },
    { wallets: db, notify },
  );
  expect(result).toEqual({ ok: false, error: "notify_failed", committed: true });
  expect(db.snapshot()).toEqual({ w1: 60, w2: 50 });
});
```

`notify` is mocked because it is the external edge. `memoryWallets` is a fake for owned state - not mock theater. Call asserts sit beside outcome checks; they do not replace them.

---

## 2. Collapsed failures -> distinct modes

Same result-object API on both sides. The upgrade is sharper asserts, not a new failure style.

**Without**

```ts
it("rejects bad transfers", async () => {
  const a = await processTransfer({ from: "w1", to: "w2", amount: -1 }, deps);
  expect(a.ok).toBe(false);
  const b = await processTransfer({ from: "missing", to: "w2", amount: 1 }, deps);
  expect(b.ok).toBe(false);
});
```

**With**

```ts
it("rejects non-positive amount as validation_error", async () => {
  const result = await processTransfer({ from: "w1", to: "w2", amount: 0 }, deps);
  expect(result).toEqual({ ok: false, error: "validation_error" });
});

it("returns not_found when source wallet is missing", async () => {
  const result = await processTransfer({ from: "missing", to: "w2", amount: 1 }, deps);
  expect(result).toEqual({ ok: false, error: "not_found" });
});
```

---

## 3. False regression -> must fail on the old defect

Bug: fee rounded with `Math.floor` so 99 cents became free on small transfers.

**Without** (stays green on broken code)

```ts
it("applies a fee", () => {
  expect(feeCents(1000)).toBeGreaterThan(0);
});
```

**With**

```ts
it("charges at least 1 cent fee on amounts under the percent step", () => {
  // old bug: Math.floor(99 * 0.01) === 0
  expect(feeCents(99)).toBe(1);
});
```

---

## 4. Five copies -> one rule

**Without**

```ts
it("accepts 1", () => { expect(parseQty("1")).toBe(1); });
it("accepts 2", () => { expect(parseQty("2")).toBe(2); });
it("accepts 10", () => { expect(parseQty("10")).toBe(10); });
it("rejects 0", () => { expect(parseQty("0")).toBeNull(); });
it("rejects -1", () => { expect(parseQty("-1")).toBeNull(); });
```

**With**

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
