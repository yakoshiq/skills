# verification-planning - before / after

The task is acceptance, not an invitation to audit everything:

> Verify that an administrator can grant and revoke a subscription, and that both changes survive a reload. The project requires its integrated check before handoff. The local provider is controlled; live-provider access is unavailable.

## Starting point

The targeted tests and integrated check passed on the current code and local changes. The local API is ready and its server process remains running. A grant request returned HTTP 200, but persisted grant state and the revoke journey have not been exercised. Only a Git fetch happened after the checks.

## Without the skill - more runs, less proof

The agent waits for the ready server to exit, restarts it, repeats the unchanged full suite, and calls the work complete because the grant request succeeded. It describes the controlled provider as end-to-end live validation.

The extra runs do not establish persistence, the revoke outcome, or real-provider behavior.

## With the skill - close the actual gaps

- Reuse the recorded checks after confirming that code, local changes, and material environment are still the checked state. A fetch alone did not invalidate them. If the project instead requires a fresh final run, perform it.
- Keep the ready service running and use it. Observe a grant through the admin interface, reload or independently reread the persisted subscription, and verify the granted state.
- Exercise revoke and verify the revoked state after rereading it. Do not treat successful grant as coverage of revoke.
- Report local acceptance separately from unavailable live-provider validation. If live evidence is required for the requested acceptance, that part remains blocked; a controlled substitute cannot close it.
- Stop when the agreed local outcomes and required checks have evidence. Do not expand the task into unrelated billing, deletion, or infrastructure work.

This is an illustrative plan, not a claim that these checks ran in this repository.

## When the next action changes

| Situation | Next action |
|---|---|
| Checks passed; only a fetch followed | Reuse still-valid results unless a required fresh-run gate says otherwise |
| Subscription persistence code changed after the check | Rerun the affected persistence proof and required final checks; do not reuse stale acceptance |
| Controlled-provider smoke passed; live access is unavailable | State the boundary and leave any required live check unproved |
| Ready API process is still running | Exercise the required API/UI path rather than waiting for server exit |
| Grant passed; revoke was not exercised | Verify revoke before claiming the agreed pair complete |
| Payment response timed out; callback was already recorded | Reconcile the recorded payment state before any replay; do not wait for a second callback or create another payment blindly |

The skill chooses the sufficient evidence and next action. `tests-that-matter` determines whether an individual test actually proves its claimed behavior; `surgical-changes` keeps the implementation diff within the request.

## Check the premise that makes a risky change safe

For a schema change, the premise might be “no running consumer still reads the old field.” Search symbol references, then inspect persisted records and deployed/runtime readers; prove compatibility with a representative stored record and the real deserializer if access permits. If production data or runtime access is unavailable, name that unproved part rather than treating unit coverage as proof.
