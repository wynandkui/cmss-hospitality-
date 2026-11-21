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
