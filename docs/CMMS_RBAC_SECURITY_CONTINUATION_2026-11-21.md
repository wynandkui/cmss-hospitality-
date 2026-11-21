# CMMS RBAC security continuation — 2026-11-21

## Reconciled baseline

- Current branch: `develop/v1.2-rbac-production-readiness`.
- Verified branch tip before this note: `34d338f` (integration evidence); earlier `88e89c5` records 92 local unit checks.
- Referenced `2cea60e` is not present in local object database or advertised local tracking history; do not treat it as a verified commit.
- Existing Gate 0 disposable evidence records 10/10 migration, 7/7 backup/restore, and 55/55 RBAC integration checks. These were **not rerun** here.
- Untracked root `.gitignore` is user-owned and intentionally untouched.

## Security review (source inspection, not executed acceptance tests)

- `cmms/server/api.js` stores sessions in an in-memory Map, snapshots `role`, `personId`, and permissions on login (`/api/login`).
- `/api/logout` deletes its token; `/api/permissions` PATCH deletes sessions of the targeted technician after commit.
- Review gap: role change, account disable, employee reassignment and password reset paths must each be checked for active-session invalidation. The current `auth()` checks session expiry and Map membership, not current account state in SQL.
- Existing `cmms/tools/integration-rbac.mjs` checks logout invalidation and numerous RBAC paths, but this review does not establish coverage for account disable or post-login role mutation.

## Next bounded automated security gate

1. Use only isolated disposable MariaDB fixture and localhost API; never connect production or migrate its schema.
2. Add negative tests for unauthenticated requests, forbidden roles, cross-technician work-order reads/updates, privilege escalation and unchanged revision/data after rejection.
3. Add tests for permission revocation, account deactivation, role reassignment, password reset and stale-session reuse; ensure previously issued tokens fail with 401 after each security change.
4. Fix confirmed defects in narrow commits; execute each affected security suite once and capture logs under a local ignored evidence directory. Do not rerun the entire 92-test baseline without code changes warranting it.
5. Record counts, failure details, SHA of test evidence and exact commit IDs; do not commit passwords, cookies, raw fixtures or `.env` files.

## Token-efficient execution protocol

- Batch related edits, tests, documentation and Git staging in a single controlled local runner; return only gate status, counts, commit hash and blocking errors to chat.
- Fail fast on unsafe database target, dirty tracked files, missing prerequisites or a failing security assertion. Preserve full local logs for audit.
- Commit and push only reviewed source/tests/docs; do not stage untracked files wholesale.
- This checkpoint is **documentation and source review only**, not security-gate acceptance or deployment approval.

## Security gate 1 — technician separation (implementation checkpoint)

Source review established that `/api/users` PATCH invalidates affected sessions after an account edit, and `/api/users/status` invalidates sessions on status change. `/api/users/separate` previously changed `person_id` without revoking existing tokens, leaving an authenticated session with the prior employee scope until expiration. Added post-commit invalidation for the separated account in `cmms/server/api.js`.

Added two narrowly scoped source-level regression checks in `cmms/tests/session-invalidation-source.test.js`. Observed: **2 passed, 0 failed**; `node --check cmms/server/api.js` succeeded. These are structural checks, **not** live API integration tests; they do not establish revocation under concurrent requests or verify database rollback behavior. A disposable database-backed negative/session suite is still required before release approval.

No production database was accessed. Existing `.gitignore` remains untracked and untouched.

## Security gate 2 — live disposable integration

Date: 2026-11-21 SAST. Added three live assertions to `cmms/tools/integration-rbac.mjs`, after existing browser tests: (1) technician deactivation revokes prior session and blocks fresh login, (2) administrator password change revokes existing admin session, and (3) manager attempting a technician permission update receives HTTP 403 with unchanged database permissions. These use the cloned, randomly named disposable database on the isolated MariaDB container only.

Initial execution reached 56 checks but failed on a test-fixture conflict (HTTP 409) when trying to edit the fixture technician already linked to an existing employee. This was a test setup mistake, not evidence of a product defect. Corrected the password-revocation case to change the disposable administrator's own password. The subsequent execution reported **INTEGRATION PASS 58/58**, including all three new checks, and **Disposable test database removed**. Logs are local at `/tmp/cmms-security-gate-20261121.log` (failed attempt) and `/tmp/cmms-security-gate-20261121-r2.log` (passing run); do not commit raw logs or credentials.

Remaining coverage: live `/api/users/separate` employee-scope revocation, concurrent in-flight request races, and independent authorization matrix review. Passing 58/58 is not production certification.

## Security gate 3 — employee-scope reassignment live acceptance

Extended the disposable integration suite to insert a second synthetic technician account sharing the fixture's `it_person` employee record, then authenticated the original technician and invoked the administrator-only `/api/users/separate` operation. Confirmed HTTP 200, a different committed `person_id`, and HTTP 401 for the original session token. This exercises the post-commit session invalidation added in commit `df52540`.

Observed complete integration run: **INTEGRATION PASS 59/59**, followed by **Disposable test database removed**. Local raw log: `/tmp/cmms-security-gate-separation-20261121.log` (not committed). Temporary test-only `.env` removed on shell exit. No production data used.

Still pending: adversarial concurrent in-flight request tests, broader authorization matrix and formal production-readiness review.

## Security gate 4 — negative authorization matrix and concurrent stale-token reads

Added five administrative mutation routes to the live disposable integration matrix: account status, technician separation, account edit, permission edit, and audit settings. For each route, an unauthenticated request was rejected with HTTP 401 and a manager request with HTTP 403 (ten denied mutations). Compared serialized `cmms_state` and revision before/after; both unchanged. After technician employee-scope reassignment revoked its old token, issued twelve concurrent `/api/me` requests with that token and confirmed twelve HTTP 401 responses.

Observed **INTEGRATION PASS 61/61** and **Disposable test database removed**. Temporary `.env` removed. Raw local log: `/tmp/cmms-security-gate-matrix-20261121.log` (not committed). Tests demonstrate *post-revocation* concurrency, not an in-flight request/revocation race. In-flight race and comprehensive authorization matrix remain open before production certification.

## Security gate 5 — in-flight race threat model (review checkpoint)

Code inspection on 2026-11-21: `auth(req)` retrieves an in-memory session snapshot synchronously; authorization is subsequently applied by route handlers, many of which await request-body parsing and database operations. Revocation deletes matching entries from `sessions` after an account mutation commits. Therefore the existing 12-concurrent-request test proves denial for requests **started after** revocation, but does not prove an already-authenticated request cannot finish after revocation. This is an identified **time-of-check/time-of-use risk**, not a confirmed exploit. There are 19 `await payload(req)` occurrences and 15 transaction starts in the current server; these counts alone do not establish which endpoints are vulnerable.

Required next acceptance: deterministically pause a disposable authenticated mutation after session acquisition but before commit; revoke account concurrently; resume the mutation; assert denied/rolled back or document the explicitly accepted consistency contract. Avoid timing-dependent sleeps and avoid global locks without measuring impact. Review transaction boundaries and privilege/scope revalidation before any server fix. Do not certify production readiness until the race outcome is resolved.

## Security gate 6 — transactional account revalidation for state writes

The `/api/state` PUT handler previously used only the cached in-memory session. Added a `SELECT ... FOR UPDATE` of the authenticated account within the state-write transaction and fail-closed HTTP 401 when account is absent/inactive or username, role, linked employee, or normalized permissions differ from the session snapshot. This prevents a state write with a stale cached authorization snapshot when a database-side account change was committed before the write's authorization check. The account row lock also serializes overlapping account mutations with this check, although lock ordering, deadlocks, and precise in-flight timing remain to be tested.

Added disposable integration assertion: log in as synthetic technician, directly disable the account in disposable database (leaving in-memory token intact), attempt `/api/state` PUT with valid revision, expect HTTP 401, and confirm revision and serialized state unchanged; restore synthetic account. Initial attempt used manager role and correctly received 403 because managers cannot call the legacy state PUT route; adjusted fixture to technician. Final run: **INTEGRATION PASS 62/62**, **Disposable test database removed**. Log: `/tmp/cmms-security-gate-revalidation-r2-20261121.log`. Temporary `.env` removed. No production data used. This is not a complete deterministic mid-flight revocation test; production readiness remains unapproved.

## Security gate 7 — deterministic blocked-write revocation scenario

Added a live test using a second MariaDB connection to hold `cmms_state` row lock, initiate an authenticated technician `/api/state` PUT, disable the technician account in the disposable database, then release the state lock. The server's in-transaction account revalidation rejects the write with HTTP 401 and the state revision and serialized data remain unchanged. No timing-based sleep is needed to keep the write from passing the lock before revocation. Note that this test does not independently instrument proof that the HTTP handler reached its lock wait before revocation; it guarantees the write could not pass the held lock before revocation, and verifies the resulting rejection. It does not cover all transaction interleavings or all mutation routes.

Result: **INTEGRATION PASS 63/63**, **Disposable test database removed**. Local log: `/tmp/cmms-security-gate-inflight-20261121.log`. Temporary `.env` removed. Remaining production readiness: verify other privileged mutation paths' transaction-level authorization, lock-order/deadlock resilience, threat-model sign-off, and operational deployment gates. No production changes.

## Security gate 8 — shared transaction-level account validation

Extracted the state-write account snapshot validation into `revalidateAccountForWrite(connection,session)` and applied it after acquiring the `cmms_state` row lock to seven additional mutation routes: procurement create/action, employee contact, PM plan creation, work order create/assign, and finance maintenance cost posting. The helper locks the account row and compares active status, username, role, linked employee and normalized permissions with the authenticated session snapshot. Lock order is consistently state row then account row for these routes. This prevents stale cached permissions from authorizing a write when account changes commit before the account revalidation point.

Full disposable suite after change: **INTEGRATION PASS 63/63**, **Disposable test database removed**, temporary `.env` cleaned. Log `/tmp/cmms-security-gate-shared-20261121.log`. This regression pass does not independently test a revocation race for every newly covered route. Other mutation paths (accounting, audit, users, uploads) still need route-specific concurrency/security review; no production approval.

## Security gate 9 — accounting write transactions

Applied `revalidateAccountForWrite(connection,session)` at transaction start for administrator-only manual journal posting, supplier invoice posting, and accounting-period close. These routes now recheck account status and authorization snapshot using a row lock before posting financial mutations. The existing integration suite passed **63/63** with disposable DB removed and `.env` cleaned. Local log: `/tmp/cmms-security-gate-accounting-20261121.log`. This is a regression result, not dedicated accounting race coverage. Bank reconciliation, audit settings, user-management and upload paths still need review for stale in-memory session authorization. Production remains blocked.

## Security gate 10 — reconciliation and audit configuration

Moved bank reconciliation's ledger read, reconciliation insert, and audit entry into one explicit transaction, preceded by `revalidateAccountForWrite` on the authenticated administrator account. Audit settings PATCH now revalidates the administrator account inside its existing transaction before mutation. This narrows the stale-session authorization window and ensures bank reconciliation data/audit atomicity; it does not make ledger balances serializable against concurrent posting. Existing disposable integration suite: **63/63 PASS**; disposable DB removed, `.env` cleaned. Evidence `/tmp/cmms-security-gate-reconcile-20261121.log`. Dedicated tests for reconciliation concurrency, upload file/DB atomicity and admin-management revocation races remain open. No production changes.
