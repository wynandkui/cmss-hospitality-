# CMMS Gates 27–28 — recovery and pilot acceptance record

**Date:** 2026-11-21  
**Branch:** `develop/v1.2-rbac-production-readiness`  
**Environment:** isolated local development/test; **NOT PRODUCTION APPROVED**.

## Gate 27 — Backup and recovery

### Verified in disposable environment

- MariaDB SQL dump restored into a uniquely named disposable database; original fixture left unchanged.
- All 12 restored table inventories and data hashes compared against fixture baseline.
- Critical users, state, transaction and audit tables present and JSON state parses.
- SHA-256 detects a tampered in-memory dump before restore.
- Synthetic attachment bytes copied into a disposable recovery directory, SHA-256 verified.
- Attachment metadata inserted **only into the restored disposable database** and reconciled against recovered files; missing and orphaned media identified.
- Latest restore suite: **9/9**, evidence `/tmp/cmms-gate27-media-restore.log` (local ephemeral log).

### Open acceptance requirements — not demonstrated

- Defined backup schedule, retention, encrypted offsite copy, restore credentials and access controls.
- Verified recoverability of an actual coordinated database **and complete attachment set** from the same recovery point.
- Documented RPO/RTO targets, timed full application restore and business-owner acceptance.
- Automated backup failure alerting, media inventory reconciliation and periodic restore exercises.

**Gate 27 decision: CONDITIONAL / OPEN.** Test-fixture recovery passed; production recovery readiness not established.

## Gate 28 — Final acceptance and hospitality pilot

### Evidence available

- Latest separately executed suites: 102 unit/source, 75 MariaDB integration, 10 migration, 9 restore = **196/196**. This is an aggregate of latest respective runs, **not a single unified release pipeline**.
- Six-role RBAC: 48 privileged read decisions and 60 unauthorized mutation decisions; negative tests preserve state, audit and accounting data.
- Actual isolated API SIGKILL during attachment upload leaves a detectable orphan; automatic recovery is **not implemented**.
- HTTPS-mode application cookies and origin behavior tested on loopback HTTP; **real TLS transport has not been tested**.
- Changes recorded on development branch and pushed to GitHub.

### Blocking acceptance criteria

1. **Security:** close Gate 25 full endpoint/record-scope authorization audit; independently review privilege boundaries, sessions, login throttling, audit and secrets.
2. **Deployment:** close Gate 26 with a real trusted TLS terminator, hostname validation, verified browser sessions and proxy/network restrictions.
3. **Recovery:** close Gate 27 operational requirements above and establish media-orphan recovery procedure.
4. **Business UAT:** conduct signed scenario-based pilot for maintenance work orders, PM schedules, technician scopes, purchasing approvals, financial segregation, audit and reporting.
5. **Operations:** document ownership, monitoring, alerting, incident/rollback procedures, training and support escalation.
6. **Approval:** obtain named business owner, IT/security and maintenance management sign-off; approve pilot scope and rollback window before any live data or public access.

**Gate 28 decision: NOT APPROVED / OPEN.** Automated testing is encouraging but is not a substitute for real TLS, recovery objectives, independent security assessment and stakeholder sign-off. **Do not deploy to production.**

## Reproducibility and evidence

- Restore harness: `cmms/tools/test-backup-restore.mjs`, guarded by `CMMS_RUN_DISPOSABLE_RESTORE=YES` and a database-name safety assertion.
- API/RBAC integration: `cmms/tools/integration-rbac.mjs`, guarded by `CMMS_RUN_DISPOSABLE_INTEGRATION=YES`.
- Earlier continuation and evidence: `docs/CMMS_RBAC_SECURITY_CONTINUATION_2026-11-21.md`.
- No production data was modified during these tests. Temporary restore database, files and dump were removed by the harness.
