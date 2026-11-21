# Gate 0 — Preliminary Source Audit and Capacity Decision
Date: 2026-11-21 | Status: PARTIAL; not a completed 184-requirement conformance audit

## Evidence examined
Controlled Excel baseline `CMMS_Enterprise_Conformance_Register_v1.xlsx` opened locally: 184 requirements, fields ID/module/priority/evidence/conformance/acceptance. All 184 conformance verdicts initially 'Not assessed'. Controlled Word baseline available separately.

Read directly from GitHub branch `develop/v1.2-rbac-production-readiness`:
- `cmms/README.md` and `cmms/USER_MANUAL.md`: original Puter mode; not enterprise multiuser; manual PM issuance.
- `cmms/server/README.md`: MariaDB shared-mode versioned JSON state, optimistic concurrency, memory sessions, local media.
- `cmms/package.json`: Node tests/build and explicit opt-in integration, migration, restore test scripts.
- `cmms/server/api.js`: imports `role-policy.js`, `procurement-security.js`, finance and operations modules; session cookie with HttpOnly/SameSite=Strict, server audit/transaction journaling functions.
- `cmms/src/validation.js`: asset/location/person/parts/work-order/PM/inspection/readings validation.
- `cmms/src/qr.js`: asset/work order QR payload and SVG generation.
- `cmms/tools/integration-rbac.mjs`: disposable DB integration harness with six roles and negative API tests; source inspection only.
- `cmms/tools/test-role-migration.mjs`: disposable role migration safety test; source inspection only.
- `cmms/tools/test-backup-restore.mjs`: disposable backup/restore test with checksums; source inspection only.
- `cmms/PROCUREMENT_APPROVAL_AUDIT_SPEC.md`: design document explicitly says NOT enabled. **However** current API imports procurement security and audit modules. Thus implementation status is not resolved from the design disclaimer alone; inspect endpoints and run isolated tests before assigning verdict.

## Initial audit observations (NOT acceptance verdicts)
1. **Existing implementation evidence:** validation for major core record types; server-side session/auth primitives; role/procurement security module imports; audit journal routines; integration and migration test harnesses. This is code presence, not a fresh passing test.
2. **Architectural risk:** shared JSON document with optimistic revisions is not a normalized enterprise relational data model; scaling and atomicity need assessment.
3. **Operating risk:** memory-only sessions expire on server restart; design a persistence/rotation policy appropriate to deployment.
4. **Feature uncertainty:** unattended server-side PM scheduling not established from inspected documentation; may be release-critical.
5. **Safety/compliance:** statutory evidence and approvals must be validated against SA requirements by competent reviewers; software cannot itself certify legal compliance.
6. **Source-of-truth conflict:** older manual describes initial Puter app, while current MariaDB API includes newer code. Do not classify entire modules as gaps solely from old manual.
7. **Evidence limitation:** no tests executed; no production access; no full 184-row requirement-to-file mapping performed yet. Do not mark Gate 0 complete.

## Required capacity decision
**Actual productive engineering capacity is not known.** User must confirm number of developers and hours/week each can reliably contribute, plus availability of a product owner for acceptance and external compliance review. AI assistance does not count as an independently staffed full-time engineer.

Assumption-based forecast remains:
- At 40 productive engineering hours/week, pilot R1 March–April 2027 and full enterprise Dec 2027–Jan 2028, subject to Gate 0 and release gates.
- At 20 h/week, completion shifts substantially; see `docs/CMMS_RELEASE_FORECAST_2026-11-21.md`.
- Do **not** upgrade dates to a commitment until capacity is confirmed and critical path validated.

## Completion criteria for Gate 0
- For each of 184 requirement IDs: repository path + function/endpoint, status (verified/tested, implemented/unverified, design-only, gap, not assessed), acceptance test and dependency; distinguish Puter vs MariaDB.
- Inventory all tests and record pass/fail at current HEAD in isolated environment.
- Determine pilot scope, estimate remaining hours by task, dependency graph and named owners.
- Confirm actual productive engineering capacity and update release forecast.
- No production DB, code or deployment changes as part of this audit.

## Next single decision
Ask project owner: **How many productive development hours per week can be committed, and by how many developers?** Without that answer, the schedule cannot be made an evidence-based commitment.
