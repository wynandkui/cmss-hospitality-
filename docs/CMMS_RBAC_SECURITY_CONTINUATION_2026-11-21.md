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
