# jane-street-style - before / after

The task is an intentional redesign, not an ordinary bug fix:

> Make the wallet debit path explicit about its domain operation and failures. Add a clear API for new callers, but keep the legacy `process(d, flag, mode)` entry point and its observable behavior.

The important behavior is already in production:

- `mode !== 1` returns `false`.
- Invalid payloads and missing wallets return `false`.
- A successful debit returns the new balance.
- Notification happens after the balance changes.
- If notification fails, `process` returns `false`, but the debit remains committed.

## Starting point

```ts
const wallets: Record<string, number> = {};

declare function notifyProvider(userId: string, delta: number): void;

export function process(d: any, flag = true, mode = 0): any {
  try {
    if (mode !== 1) return false;
    if (
      typeof d.uid !== "string" ||
      typeof d.amt !== "number" ||
      d.amt <= 0 ||
      !(d.uid in wallets)
    ) {
      return false;
    }

    const bal = wallets[d.uid] - d.amt;
    wallets[d.uid] = bal;
    if (flag) notifyProvider(d.uid, -d.amt);
    return bal;
  } catch {
    return false;
  }
}
```

The code works, but its public meaning is hidden behind `process`, `d`, `flag`, `mode`, `any`, and one `false` for every failure.

## Without the skill - cosmetic clarity

A surface cleanup may improve spelling while keeping the same ambiguity:

```ts
export function updateWallet(
  payload: any,
  shouldNotify = true,
  operation = 0,
): any {
  try {
    if (operation !== 1) return false;
    if (!isValidPayload(payload)) return false;

    const newBalance = wallets[payload.userId] - payload.amount;
    wallets[payload.userId] = newBalance;
    if (shouldNotify) notifyProvider(payload.userId, -payload.amount);
    return newBalance;
  } catch {
    return false;
  }
}
```

The names are longer, but callers still cannot tell:

- which operation `1` selects;
- whether `false` means invalid input, missing wallet, or provider failure;
- whether a failed result changed the balance;
- whether the old `process` entry point still exists.

Renaming alone does not make the failure and effect model honest.

## With the skill - clear core, compatibility at the boundary

The new API names the domain operation and exposes distinct failures:

```ts
export class InvalidDebit extends Error {
  constructor(readonly amount: number) {
    super(`debit amount must be positive: ${amount}`);
    this.name = "InvalidDebit";
  }
}

export class WalletNotFound extends Error {
  constructor(readonly userId: string) {
    super(`wallet not found: ${userId}`);
    this.name = "WalletNotFound";
  }
}

export class NotifyFailedAfterDebit extends Error {
  constructor(
    readonly userId: string,
    readonly balance: number,
    readonly cause: unknown,
  ) {
    super(`wallet ${userId} debited; notification failed`);
    this.name = "NotifyFailedAfterDebit";
  }
}

export function debitWallet(
  userId: string,
  amount: number,
  opts: { notify?: boolean } = {},
): number {
  if (amount <= 0) throw new InvalidDebit(amount);

  if (!(userId in wallets)) throw new WalletNotFound(userId);
  const currentBalance = wallets[userId];

  const balance = currentBalance - amount;
  wallets[userId] = balance;

  if (opts.notify ?? true) {
    try {
      notifyProvider(userId, -amount);
    } catch (cause) {
      throw new NotifyFailedAfterDebit(userId, balance, cause);
    }
  }

  return balance;
}
```

The old API remains as a complete adapter, not a comment or an ellipsis:

```ts
export function process(d: any, flag = true, mode = 0): any {
  try {
    if (mode !== 1) return false;
    if (
      typeof d.uid !== "string" ||
      typeof d.amt !== "number" ||
      d.amt <= 0
    ) {
      return false;
    }

    return debitWallet(d.uid, d.amt, { notify: Boolean(flag) });
  } catch {
    return false;
  }
}
```

## What changed, and what did not

| Concern | New `debitWallet` API | Legacy `process` API |
| --- | --- | --- |
| Domain operation | Named directly | `mode === 1` still selects it |
| Invalid amount | `InvalidDebit` | `false` |
| Missing wallet | `WalletNotFound` | `false` |
| Debit succeeds, notify fails | `NotifyFailedAfterDebit` carries committed balance | `false`, with debit still committed |
| Notification order | After balance update | Unchanged through the adapter |
| Default notification | Enabled | `flag = true`, unchanged |
| Call-shape | Clear API for new callers | `(d, flag, mode)`, unchanged |

The adapter deliberately collapses richer failures because existing callers already depend on that contract. New callers can use the explicit API without silently changing old ones.

## Why the partial-success error matters

If `notifyProvider` fails after `wallets[userId]` is updated, rollback would be a new business policy, not a refactor. Returning a generic failure from the new API would also hide committed state. `NotifyFailedAfterDebit` states both facts:

- the debit happened;
- notification failed afterward.

That makes recovery decisions possible without changing effect order.

## The shape of the improvement

| Before | After |
| --- | --- |
| `process` | `debitWallet` for new callers, `process` adapter for compatibility |
| `d.uid`, `d.amt` | `userId`, `amount` |
| `flag` | `opts.notify` |
| `mode === 1` in the core | domain operation selected by function name |
| every failure becomes `false` | distinct native errors on the new API |
| partial success is hidden | committed balance is carried by the notification error |

This is a clarity-first redesign because changing the internal shape is the explicit task. For an ordinary shape-preserving bug fix, `surgical-changes` would be the better skill and this redesign would be out of scope.
