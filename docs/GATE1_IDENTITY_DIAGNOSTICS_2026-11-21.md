# Gate 1 — Identity integrity diagnostic (offline only)

## Scope
Pure read-only inspection of a JSON snapshot with `users` and `people` arrays. No DB, network, user account or production change. It detects duplicate employee IDs, duplicate account IDs, missing/orphaned technician links and multiple technicians linked to one employee. Findings contain IDs and error codes only, never names, usernames, credentials or contact information. IDs may still be sensitive: restrict report access.

## Run

```bash
cd cmms
node tools/identity-integrity.mjs /path/to/approved-offline-fixture.json
node --test tests/identity-integrity.test.js
```

Expected fixture shape: `{ "users": [{"id":"u1","role":"technician","personId":"p1"}], "people": [{"id":"p1"}] }`. Input must be provided separately, not committed. Exit 0 means no findings; exit 1 means integrity findings; exit 2 means no file supplied.

## Acceptance and next actions
- [x] Eight synthetic negative/positive tests passed on development laptop.
- [ ] Verify safe, approved method to generate a *sanitized* snapshot from disposable database only.
- [ ] Independently review shared-employee findings before account changes.
- [ ] Add isolated API authorization tests for each identity edge case.
- [ ] Review Gate 0 PR #3 and baseline reconciliation; no automatic merge.

The tool is **diagnostic**, not enforcement. No live identity records have been inspected or changed.

## Read-only isolated MariaDB fixture acceptance — 2026-11-21

`cmms/tools/test-identity-fixture.mjs` uses explicit `CMMS_RUN_READONLY_IDENTITY_FIXTURE=YES` opt-in, verifies the configured database is `CMMS_putterdb` but connects **only** to `CMMS_v12_restore_test`, and executes a read-only consistent-snapshot transaction. It selects only account ID, role, employee ID and the fixture's employee collection, then rolls back and closes the connection. It neither exports private names nor reads the protected configured database.

Command: `cd cmms && CMMS_RUN_READONLY_IDENTITY_FIXTURE=YES node tools/test-identity-fixture.mjs`

**Observed:** 5 accounts, 4 employee records, 4 technicians; 0 findings; PASS. This establishes fixture consistency only, not live production integrity. Do not run this command against a changed/unknown database configuration.

Next: isolated HTTP negative authorization tests, then permission-change session revocation. Preserve minimal tests and no production changes.
