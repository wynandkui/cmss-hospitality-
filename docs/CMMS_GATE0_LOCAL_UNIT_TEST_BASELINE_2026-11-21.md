# Gate 0 — Local Unit Test Baseline

Date: 2026-11-21
Repository: wynandkui/cmss-hospitality-
Branch: develop/v1.2-rbac-production-readiness
Tested commit: `f513429` (short SHA supplied by developer)
Environment: Linux Mint 22.3; Node.js v20.20.2; local clone `~/Projects/CMMS/cmss-hospitality-/cmms`
Command: `npm test` (`node --test tests/*.test.js`)

## User-supplied terminal evidence
- Tests: **92**
- Passed: **92**
- Failed: **0**
- Cancelled: **0**
- Skipped: **0**
- Duration: **2583.581476 ms**
- Git working tree after execution: untracked `../.gitignore` (created earlier by Aider, not by tests).

## Covered by reported unit-test names
- Finance: exact cents, balanced journal, VAT treatment, cost posting, restricted finance projections.
- Operations: recurring preventive maintenance, issuance idempotence, work-order creation/assignment, technician-scoped views.
- Procurement: request/approval separation of duties, quotation prerequisite, one-time issuance and receiving controls.
- RBAC: role definitions, negative authorisation, scoped work-order merges, fail-closed unknown roles.
- Data quality and UI: validation, QR payloads, CSV escaping, role-aware workspace.

## Evidence limitations
This is a recorded developer-run test result, not an independently executed test by the GitHub connector. It verifies unit tests at the stated commit only; **does not verify all 184 requirements, build output, HTTP integration, MariaDB migration, backup/restore or production readiness**. Do not count 92 tests as 92 requirements. Integration/migration/restore scripts require separate disposable-environment review and authorisation.

## Next
Run `npm run build` in the same isolated local checkout (no database test), record exit status, then map each requirement ID to explicit code/test evidence. No repeated unit test necessary unless code changes.
