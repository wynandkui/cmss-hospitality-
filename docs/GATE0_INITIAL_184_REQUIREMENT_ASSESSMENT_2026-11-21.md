# Gate 0 — Initial 184-requirement evidence assessment
Date: 2026-11-21 | Source branch HEAD inspected: b16a315 | Status: preliminary, review required

## Controlled baseline
The actual user-provided `CMMS_Enterprise_Conformance_Register_v1 (1).xlsx` was read and validated in the analysis environment, **not** in the Lenovo runner. The original controlled workbook remains unchanged. The working XLSX and CSV were produced as separate downloadable conversation artifacts. Do not claim the GitHub Python importer has yet run on the actual workbook remotely.

- 184/184 unique IDs; 154 P1, 25 P2, 5 P3.
- Initial classifications: 8 VERIFIED (narrow historical test scope), 61 IMPLEMENTED, UNVERIFIED, 5 DESIGN ONLY, 110 GAP. These are conservative working judgments, not final acceptance.
- The 8 narrowly verified IDs: `WOR-008`, `WOR-009`, `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-006`. Evidence: `cmms/src/role-policy.js`, `cmms/server/api.js`, `cmms/tools/integration-rbac.mjs`, `cmms/tests/role-policy.test.js`. Recorded tests include technician scope and 403 rejection; revalidate against current HEAD before release.
- Candidate paths in the working register are **module-level leads**, not proof of each requirement. Full per-requirement source/acceptance review remains required.
- Existing test history: 92/92 unit, 55/55 disposable HTTP/browser integration, 7/7 isolated SQL backup/restore checks; historical only, not rerun for Gate 0.

## Gate 1 prioritized backlog
| Priority | Package | Requirement IDs | Acceptance / dependency |
| --- | --- | --- | --- |
| P0 | Technician–employee identity integrity | RES-002, SEC-003, SEC-004, SEC-005, SEC-011 | Read-only duplicate/orphan detection; fail-closed isolated scope tests; do not change live accounts |
| P0 | Permission change and session revocation | SEC-011, SEC-012 | Revoke prior sessions immediately on capability, role or active-status changes; negative HTTP tests |
| P0 | Proxy trust, origin and secure cookie | SEC-001, SEC-005, SEC-016 | Do not trust unvalidated forwarded headers; verify HTTPS and secure-cookie behaviour in staging |
| P0 | Encrypted DB + media recovery | SEC-013, SEC-014 | Encrypted staging restore, media integrity and explicit RTO/RPO; existing SQL-only fixture restore insufficient |
| P1 | Audit retention and POPIA controls | SEC-007, SEC-008, SEC-009, SEC-015 | Mandatory event coverage, privacy retention/access and qualified review |
| P1 | MFA/SSO decision | SEC-010 | Architecture decision, threat model, staged acceptance |
| P1 | Independent security acceptance | SEC-016 | CI, negative API and independent penetration review; manual signoff |

## Technical findings
- `cmms/server/api.js` implements authenticated endpoints, revisioned writes, audit/transaction tables and in-memory sessions.
- Session origin comparison uses request `x-forwarded-proto`; deployment trust boundary needs explicit hardening.
- `cmms/tools/test-backup-restore.mjs` validates SQL table contents in a disposable database, not encrypted production DB + media recovery.
- `cmms/src/procurement-security.js` and tests contain approval rules, but the procurement design document explicitly disclaims complete workflow acceptance.
- The README describes legacy Puter mode; enterprise conformance is evaluated against MariaDB shared mode.

## Gate 0 remaining acceptance
1. Transfer approved version 1.0 workbook to the authorized remote development runner and run `gate0-traceability.py` against that exact file; reconcile SHA-256.
2. Review all 184 candidate source/test references and assign accountable reviewers, dependencies and executable acceptance cases.
3. Retain the working XLSX/CSV in controlled storage or explicitly authorize adding a sanitized working copy to GitHub.
4. Review draft PR #3; do not merge or deploy without approval.

**Production impact:** none. No DB, media, credentials, services, account changes, merges or deployments.
