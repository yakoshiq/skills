# surgical-changes - before / after

The task is deliberately small:

> `deliver` makes one fewer send attempt than `maxAttempts`. Fix the bug and add a regression test. Preserve the existing API and failure behavior.

The surrounding file also contains vague names, broad types, and an error-handling choice that could be redesigned. None of those are required for this fix.

## Starting point

```ts
export type Sender = (message: string) => Promise<void>;

export async function deliver(
  message: string,
  maxAttempts: number,
  send: Sender,
): Promise<boolean> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts - 1) {
    try {
      await send(message);
      return true;
    } catch (err) {
      lastError = err;
      attempt += 1;
    }
  }
  if (lastError !== undefined) throw lastError;
  return false;
}

export function process(d: any, flag = true): any {
  if (!flag) return d;
  return { value: String(d.value).trim(), active: true };
}

export function parseChannel(raw: string): "email" | "sms" | false {
  try {
    const value = raw.toLowerCase();
    return value === "email" || value === "sms" ? value : false;
  } catch {
    return false;
  }
}
```

## Without the skill - the fix becomes a redesign

A typical broad response may fix the retry count while also replacing the local API:

```ts
type DeliveryResult =
  | { ok: true; attempts: number }
  | { ok: false; attempts: number; error: unknown };

interface RetryPolicy {
  attempts: number;
  shouldRetry(error: unknown): boolean;
}

export async function deliverWithRetry(
  message: string,
  policy: RetryPolicy,
  sender: Sender,
): Promise<DeliveryResult> {
  for (let attempt = 1; attempt <= policy.attempts; attempt += 1) {
    try {
      await sender(message);
      return { ok: true, attempts: attempt };
    } catch (error) {
      if (!policy.shouldRetry(error) || attempt === policy.attempts) {
        return { ok: false, attempts: attempt, error };
      }
    }
  }
  return { ok: false, attempts: 0, error: new Error("no attempts") };
}

export function normalizePayload(
  data: { value: unknown },
  enabled = true,
): { value: string; active: boolean } | { value: unknown } {
  // renamed and retyped while nearby
  /* ... */
}
```

The new code may look cleaner in isolation, but it is not the requested change:

- `deliver` disappeared and its call-shape changed.
- thrown send failures became result objects.
- a policy abstraction was introduced for one loop condition.
- `process` was renamed and retyped even though it is unrelated.
- callers and tests now need a migration that the bug did not require.

The review surface is much larger than the causal surface of the defect.

## With the skill - required plus coupled only

Production change:

```diff
-  while (attempt < maxAttempts - 1) {
+  while (attempt < maxAttempts) {
```

Focused regression at the existing public boundary:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { deliver } from "./retry";

test("deliver makes all attempts and rethrows the final failure", async () => {
  const calls: string[] = [];
  const finalError = new Error("still down");

  await assert.rejects(
    deliver("hello", 3, async (message) => {
      calls.push(message);
      throw finalError;
    }),
    finalError,
  );

  assert.deepEqual(calls, ["hello", "hello", "hello"]);
});
```

This test fails before the change because only two sends occur. After the change it proves both requested behavior and the preserved failure semantic: the final send error is still thrown.

The final scope classification is explicit:

| Edit | Class | Why |
| --- | --- | --- |
| Correct the loop bound | Required | Direct cause of the missing attempt |
| Add the focused public-boundary test | Coupled | Proves the fix and preserved rethrow behavior |
| Rename `process` | Adjacent | Naming cleanup, unrelated to retry count |
| Replace throws with a result type | Adjacent | API and failure-policy redesign |
| Add `RetryPolicy` | Adjacent | No invariant or requested variation requires it |
| Rewrite `parseChannel` | Adjacent | Separate error-handling concern |

A concise delivery note can keep the adjacent observation visible without putting it in the diff:

> Fixed the retry loop and added a regression covering all attempts plus final-error rethrow. `parseChannel` still collapses unexpected failures into `false`; that is a separate error-policy decision and was left unchanged.

The result is not merely the fewest changed characters. It is the smallest coherent change: root cause, nearest meaningful verification, and no hidden migration.
