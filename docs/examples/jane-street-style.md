# jane-street-style - before / after

Same job (debit a wallet, optionally notify a provider) under a typical agent cleanup vs this skill.

**Look for:** domain verbs instead of `process`/`mode`/`flag`; distinct failures instead of one sentinel; partial success when the balance commits and notify fails; legacy entry points as thin adapters when call-shape must stay.

Snippets are minimal on purpose - shape of the change, not a full module. GitHub has no reliable side-by-side code columns, so each language is **Without** then **With** (full syntax highlighting, works on mobile).

## TypeScript

**Without**

```ts
function process(d: any, flag = true, mode = 0): any {
  try {
    if (mode === 1) {
      const bal = cache[d.uid] - d.amt;
      cache[d.uid] = bal;
      if (flag) send(d.uid, -d.amt); // may throw after bal changed
      return bal;
    }
    /* ... */
  } catch {
    return false; // validation, infra, bug: one bucket
  }
}
```

**With**

```ts
function debitWallet(
  userId: string,
  amount: number,
  opts: { notify?: boolean } = {},
): number {
  const balance = wallets[userId] - amount;
  wallets[userId] = balance;
  if (opts.notify ?? true) {
    try {
      notifyProvider(userId, -amount);
    } catch (err) {
      throw new NotifyFailedAfterDebit(userId, balance, err);
    }
  }
  return balance;
}

// legacy adapter keeps old sentinels / call-shape
function process(d: any, flag = true, mode = 0): any { /* ... */ }
```

## Go

**Without**

```go
func Process(d map[string]any, flag bool, mode int) any {
    defer func() { recover() }() // everything -> nil/false
    if mode == 1 {
        uid := d["uid"].(string)
        amt := d["amt"].(int)
        bal := cache[uid] - amt
        cache[uid] = bal
        if flag {
            Send(uid, -amt) // error after bal changed is lost
        }
        return bal
    }
    return false
}
```

**With**

```go
func DebitWallet(userID string, amount int, notify bool) (int, error) {
    bal := wallets[userID] - amount
    wallets[userID] = bal
    if notify {
        if err := NotifyProvider(userID, -amount); err != nil {
            return bal, fmt.Errorf("debit ok, notify failed: %w", err)
        }
    }
    return bal, nil
}

// Process remains a legacy adapter when callers need the old shape.
```

## Rust

**Without**

```rust
fn process(d: &Value, flag: bool, mode: i32) -> Value {
    match std::panic::catch_unwind(|| {
        if mode == 1 {
            let uid = d["uid"].as_str().unwrap();
            let amt = d["amt"].as_i64().unwrap();
            let bal = cache[uid] - amt;
            cache.insert(uid, bal);
            if flag { send(uid, -amt); } // Err after debit discarded
            return json!(bal);
        }
        json!(false)
    }) {
        Ok(v) => v,
        Err(_) => json!(false),
    }
}
```

**With**

```rust
fn debit_wallet(
    user_id: &str,
    amount: i64,
    notify: bool,
) -> Result<i64, DebitError> {
    let bal = wallets[user_id] - amount;
    wallets.insert(user_id.into(), bal);
    if notify {
        notify_provider(user_id, -amount).map_err(|e| {
            DebitError::NotifyFailedAfterDebit {
                user_id: user_id.into(),
                balance: bal,
                source: e,
            }
        })?;
    }
    Ok(bal)
}

// process() can stay as a compatibility adapter.
```

## Python

**Without**

```python
def process(d, flag=True, mode=0):
    try:
        if mode == 1:
            bal = cache[d["uid"]] - d["amt"]
            cache[d["uid"]] = bal
            if flag:
                send(d["uid"], -d["amt"])
            return bal
        ...
    except Exception:
        return False
```

**With**

```python
def debit_wallet(user_id: str, amount: int, *, notify: bool = True) -> int:
    balance = wallets[user_id] - amount
    wallets[user_id] = balance
    if notify:
        try:
            notify_provider(user_id, -amount)
        except ConnectionError as err:
            raise NotifyFailedAfterDebit(user_id, balance) from err
    return balance

def process(d, flag=True, mode=0):  # legacy adapter
    ...
```
