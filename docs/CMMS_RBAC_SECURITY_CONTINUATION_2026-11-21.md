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

## Security gate 11 — administrative transaction revalidation (automation run)

Checked the named `ac29769` checkpoint against repository history and fetched the remote development branch. `ac29769` exists in history, but the current local and remote tip before this gate was `767747e`; no reset or history rewrite was performed. Added `revalidateAccountForWrite(connection,session)` inside the existing transactions for technician permission changes, account creation, and employee-record separation. This rejects stale administrator snapshots at the transaction's authorization point, not merely at request entry. Existing negative admin tests and employee separation integration coverage exercised these routes. The **executed** disposable suite reported **INTEGRATION PASS 63/63** and **Disposable test database removed**. Test log: `/tmp/cmms-security-gate-admin-20261121.log`; temporary `.env` removed. This run did not add dedicated in-flight race assertions for these three routes; the 63/63 figure is regression coverage only.

### Bounded readiness review — still blocked

- **High:** `/api/users` PATCH and `/api/users/status` POST still perform privileged updates outside a transaction-level administrator recheck. Other file and photo upload paths also rely on cached authorization and can write after in-flight revocation. Review and add bounded tests before release.
- **High:** `/api/users/separate` acquires target-account lock before the state row, while ordinary state-backed writes acquire state then account. This inconsistent lock order can deadlock under contention; implement a consistent order and add a controlled concurrency test.
- **Medium:** Bank reconciliation computes balance without a serializable snapshot against concurrent journal postings; confirm accounting consistency requirements and test before acceptance.
- **Medium:** File-system upload and SQL metadata/audit changes are not one atomic resource transaction; audit and cleanup behavior require failure-injection tests.
- **Release blockers:** documented threat-model sign-off, backup/restore drill, role matrix completion, and controlled pilot authorization. No production access or deployment occurred.

## Security gate 12 — administrator account-edit/status transactional guard (source-only)

On 2026-11-21, confirmed `ac29769` is an ancestor of the current branch and the branch tip before edits was `eac4a8a`. Updated `/api/users` PATCH and `/api/users/status` POST to use explicit transactions with `revalidateAccountForWrite(connection,session)` before updating target account records, rollback on failure, and existing token invalidation after successful commit. This addresses the known missing transaction-level administrator recheck for these two routes; it does **not** prove all mid-flight interleavings are safe. Existing `cmms/.env` is absent, so no disposable MariaDB integration suite was run in this gate. No production database was accessed and no credentials were created.

Executed `node --check cmms/server/api.js` (pass), `node --test cmms/tests/session-invalidation-source.test.js` (**3/3 pass**) and `git diff --check` (pass). These are structural checks only. The untracked root `.gitignore` was not read, modified or staged. Before merge or deployment: run the disposable integration suite with approved isolated test credentials; specifically verify stale admin tokens against PATCH and status POST, in-flight revocation and target-account races, and unchanged SQL/audit after 401. Also resolve the existing `/api/users/separate` account/state lock-order inversion, upload atomicity, accounting consistency, and production operational sign-offs. **Release remains blocked.**

## Resumption checkpoint — 2026-11-21 (source verification)

Resumed on `develop/v1.2-rbac-production-readiness` at `b6fd3d6`. The isolated Docker container `cmms-mariadb-test` exists, but `cmms/.env` is absent, so no live database-backed integration suite was executed and no database credentials were retrieved or changed. The narrow source-level session-invalidation suite passed **3/3**. Source inspection reconfirmed that `/api/users/separate` obtains the administrator account row lock via `revalidateAccountForWrite`, then the target technician account row lock, then `cmms_state FOR UPDATE`, whereas ordinary state-backed mutations lock `cmms_state` before the actor account row. This inconsistent order is still an unresolved deadlock risk; do not blindly reorder only one route without reviewing all account/state lock acquisitions. Next gate: design a consistent lock order across user creation, separation and state mutations; exercise the revised order with deterministic concurrency on the approved disposable MariaDB fixture. Existing untracked root `.gitignore` was not modified. No production access or deployment; release remains blocked.

## Security gate 13 — state/account lock ordering (source-level)

Changed the two state-backed administrator account operations to acquire `cmms_state FOR UPDATE` before locking the acting administrator account. Technician separation now locks state, revalidates/locks the acting administrator, and locks the target technician account in that order. Technician creation with a new People record also locks state before administrator revalidation; creation linked to an existing People record retains administrator-only revalidation. Added a source-level regression asserting lock order for both state-backed account operations. Observed **4/4 source-level checks passed**, `node --check` and `git diff --check` passed. No live MariaDB concurrency or deadlock test was run because the disposable test `.env` is absent. This is a narrow lock-order fix, **not** a proof of deadlock freedom for all routes; the full transaction graph and disposable concurrent test remain release blockers. Production data unchanged.

### Gate 13 complete unit regression

After commit `db2b0c7`, executed `npm test` once against the development working tree: **96/96 tests passed, 0 failed** (local evidence `/tmp/cmms-gate13-unit-20261121.log`). This verifies the source/unit regression baseline after the lock-order change, but does not replace the disposable MariaDB integration or deterministic concurrency gate. No live data accessed.

## Security gate 14 — upload transaction integrity and bounded readiness (2026-11-21)

Resumed at current development tip `0673539` (the requested `ac29769` checkpoint is historical, not the current tip). Inspected the live source and disposable integration harness without using any production database. **Confirmed defect:** `/api/files` POST wrote an attachment to disk, inserted SQL metadata, then wrote the audit event through separate autocommit calls. If audit insertion failed, the catch removed the file but could leave orphaned committed SQL metadata. The same route relied on cached session authorization throughout request-body upload and DB write.

**Narrow correction:** keep the existing initial role/capability checks; after writing the attachment, open an explicit SQL transaction, lock/revalidate the authenticated account, repeat capability/role authorization, insert attachment metadata and audit within the same transaction, and commit. On failure (including inability to acquire a connection), roll back when possible, delete the newly created file, and release the connection. Added source-level regression assertions for transaction order, authorization and cleanup. Executed **98/98 unit/source tests passed**, `node --check server/api.js` passed, `git diff --check` passed. Local evidence `/tmp/cmms-gate14-20261121.log`. These tests are **not** failure-injection or MariaDB-backed acceptance; no disposable integration test was run because the approved `.env` test configuration remains absent. No secrets, test databases or production services were modified.

**Bounded release assessment:** BLOCKED. High-priority unresolved: deterministic mid-flight session revocation across all privileged mutations; file/photo read and photo write authorization during revocation; explicit filesystem/SQL crash-recovery contract and failure-injection tests (atomicity across resources remains impossible with a single SQL transaction); concurrent lock-order and deadlock tests against an approved disposable MariaDB fixture; full six-role negative API matrix with unchanged SQL/audit assertions. Medium: accounting reconciliation serializability. Operational blockers: threat-model sign-off, restore drill, HTTPS/session deployment controls, pilot authorization. Existing untracked root `.gitignore` remains untouched. No production deployment approved.

## Security gate 15 — requested isolated MariaDB/RBAC continuation (2026-11-21)

At development tip `d09d78f`, reran `npm test` in `cmms/`: **98/98 passed, zero failed**, exit code 0. Local evidence `/tmp/cmms-rbac-regression-20261121.log`. Verified that the dedicated integration harness `cmms/tools/integration-rbac.mjs` explicitly requires `CMMS_RUN_DISPOSABLE_INTEGRATION=YES`, `cmms/.env` with `DB_NAME=CMMS_putterdb`, and source fixture database `CMMS_v12_restore_test`; it creates and later drops a randomly named disposable database. The existing `cmms-mariadb-test` container is running on private Docker network `cmms-test-private`, but its presence alone does not prove that the fixture and credentials are configured. `cmms/.env` is absent; the container has no configured root password environment variable to use as a trusted fixture credential. **Did not run the database-backed suite, create credentials, modify a database, or access production.**

Next gate: provision/confirm an explicitly authorized disposable fixture and its isolated credentials, verify target identity before running the destructive integration harness, then execute the full six-role negative API matrix and deterministic revocation, upload-failure, and lock-contention tests. No claim of MariaDB-backed acceptance or pilot readiness. The unrelated untracked repository-root `.gitignore` was left unchanged.
