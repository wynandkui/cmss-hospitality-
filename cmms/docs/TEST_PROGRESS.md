# CMMS v1.2 — Test progress register
Updated: 2026-11-17. Branch: `develop/v1.2-rbac-production-readiness`.

Status values: **NOT RUN**, **PASS**, **FAIL**, **BLOCKED**. A committed test is not a passed test.

| ID | Area | Required acceptance test | Status | Evidence |
|---|---|---|---|---|
| T-001 | Baseline | Existing `npm test` passes | PASS | User-run `npm test`, 2026-11-17: 51 passed, 0 failed, 1.356547056 s; development branch |
| T-002 | Build | `npm run build` succeeds | PASS | User-run `npm run build`, 2026-11-17: `Static site prepared in dist/ (no external build dependencies).` |
| T-010 | Roles | Role matrix grants only intended capabilities | PASS | User-run `npm test`, 2026-11-17: role-policy unit tests passed; API integration NOT tested |
| T-011 | Migration | Existing admin/technician credentials survive role migration | NOT RUN | — |
| T-012 | Sessions | Disabled account and role change revoke existing sessions | NOT RUN | — |
| T-013 | Users | Only administrator can create/assign roles/reset credentials | NOT RUN | — |
| T-020 | Work orders | Manager creates WO; Supervisor assigns WO | NOT RUN | — |
| T-021 | Technician | Technician can update own assigned WO only | NOT RUN | — |
| T-022 | Technician | Technician cannot enumerate other workers' WO or private people data | NOT RUN | — |
| T-023 | Reporting | Technician prints only own completion/status reports | NOT RUN | — |
| T-030 | PM | Coordinator creates/edits PM schedule; technician cannot | NOT RUN | — |
| T-040 | Purchasing | Manager creates PO; approvals enforce separation of duties | NOT RUN | — |
| T-050 | Finance | Finance Admin can use all financial endpoints; others denied | NOT RUN | — |
| T-051 | Supplier | Supplier statement prints company/vendor details correctly | NOT RUN | — |
| T-060 | Demo | Isolated fixture covers assets, locations, people, WO, PM, inventory, purchasing, finance | NOT RUN | — |
| T-070 | Security | Direct unauthorized API calls return 403, not only hidden UI | NOT RUN | — |
| T-080 | Recovery | Backup/restore and migration rollback rehearsal | NOT RUN | — |
| T-090 | UAT | Product owner signs off each role workflow | NOT RUN | — |

## Execution log
| Date | Commit | Environment | Command/scenario | Result | Notes |
|---|---|---|---|---|---|
| 2026-11-17 | develop/v1.2-rbac-production-readiness (user checkout) | Lenovo Linux Mint, Node test runner | `npm test` | PASS | 51 tests; 51 passed; 0 failed; 0 skipped; duration 1356.547056 ms. User supplied terminal output. Exact local HEAD SHA not supplied. |
| 2026-11-17 | develop/v1.2-rbac-production-readiness | Lenovo Linux Mint | `npm run build` | PASS | `Static site prepared in dist/ (no external build dependencies).` User supplied terminal output. |
| 2026-11-17 | — | — | MariaDB migration and role/API tests | NOT RUN | Not covered by build or unit tests. |

## Next
Audit current route authorization and implement tested role policy without changing main.
