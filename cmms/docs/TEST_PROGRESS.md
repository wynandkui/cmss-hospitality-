# CMMS v1.2 — Test progress register
Updated: 2026-11-17. Branch: `develop/v1.2-rbac-production-readiness`.

Status values: **NOT RUN**, **PASS**, **FAIL**, **BLOCKED**. A committed test is not a passed test.

| ID | Area | Required acceptance test | Status | Evidence |
|---|---|---|---|---|
| T-001 | Baseline | Existing `npm test` passes | PASS | User-run `npm test`, 2026-11-17: 51 passed, 0 failed, 1.356547056 s; development branch (initial baseline); later 56/56 passed |
| T-002 | Build | `npm run build` succeeds | PASS | User-run `npm run build`, 2026-11-17: `Static site prepared in dist/ (no external build dependencies).` |
| T-010 | Roles | Role matrix grants only intended capabilities | PASS | User-run `npm test`, 2026-11-17: role-policy unit tests passed; 2026-11-17 rerun 56/56 passed; API integration NOT tested |
| T-011 | Migration | Existing admin/technician credentials survive role migration | NOT RUN | DRY RUN PASS: 2026-11-17 `node tools/migrate-roles.js` reported needed=true, 1 admin, 4 technicians, no changes. Actual migration NOT RUN |
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
| T-080 | Recovery | Backup/restore and migration rollback rehearsal | NOT RUN | Backup CREATED 2026-11-17: 34055 bytes, SHA-256 9f900ff5a9d49479ec34700ac7bc7d3277c4479f4c4ea1e720f09f817876db37; SHA-256 verified; 12 CREATE TABLE statements; cmms_users at line 461. Isolated restore NOT RUN |
| T-090 | UAT | Product owner signs off each role workflow | NOT RUN | — |

## Execution log
| Date | Commit | Environment | Command/scenario | Result | Notes |
|---|---|---|---|---|---|
| 2026-11-17 | develop/v1.2-rbac-production-readiness (user checkout) | Lenovo Linux Mint, Node test runner | `npm test` | PASS | 51 tests; 51 passed; 0 failed; 0 skipped; duration 1356.547056 ms. User supplied terminal output. Exact local HEAD SHA not supplied. |
| 2026-11-17 | develop/v1.2-rbac-production-readiness | Lenovo Linux Mint | `npm run build` | PASS | `Static site prepared in dist/ (no external build dependencies).` User supplied terminal output. |
| 2026-11-17 | develop/v1.2-rbac-production-readiness (cf970ff checkout) | Lenovo Linux Mint | `npm test` | PASS | 56 tests; 56 passed, 0 failed; duration 1496.015821 ms. User supplied output. |
| 2026-11-17 | cf970ff checkout | MariaDB (read-only) | `node tools/migrate-roles.js` | PASS (DRY RUN) | Migration needed=true; 1 admin and 4 technicians; no changes made. |
| 2026-11-17 | — | — | Actual MariaDB migration and role/API tests | NOT RUN | Awaiting verified database backup and migration approval. |

| 2026-11-17 | 07e05cd checkout | Lenovo Linux Mint / MariaDB | `node tools/backup-before-v1.2.js` | BACKUP CREATED | 34055 bytes, SHA-256 9f900ff5a9d49479ec34700ac7bc7d3277c4479f4c4ea1e720f09f817876db37. Structural check only; restore not verified. |

| 2026-11-17 | 07e05cd checkout | Lenovo Linux Mint | `sha256sum`, `grep -c '^CREATE TABLE'`, `grep -n cmms_users` | PASS (FILE INTEGRITY) | SHA-256 matches 9f900ff5a9d49479ec34700ac7bc7d3277c4479f4c4ea1e720f09f817876db37; 12 CREATE TABLE statements; cmms_users at line 461. Restore not tested. |

## Next
Audit current route authorization and implement tested role policy without changing main.

| 2026-11-17 | Local SQL backup | MariaDB isolated database `CMMS_v12_restore_test` | Import sanitized SQL backup | PASS (IMPORT) | User confirmed RESTORE SUCCESSFUL and 12 restored tables. Account content and full recovery verification pending. Original `CMMS_putterdb` not targeted. |

| 2026-11-17 | Local SQL backup | MariaDB isolated database `CMMS_v12_restore_test` | Verify restored `cmms_users` counts and password hashes | PASS | 1 admin and 4 technicians, all 5 with nonempty password hashes; `person_id IS NOT NULL` for all 5 (not proof links resolve). Original database not targeted. |

| 2026-11-17 | Isolated restored backup | MariaDB `CMMS_v12_restore_test` | Expand role ENUM to six roles | PASS (ISOLATED) | ALTER TABLE succeeded; role ENUM lists admin, manager, supervisor, coordinator, finance_admin, technician; NOT NULL; 1 admin and 4 technician accounts preserved. Working DB not modified. |

| 2026-11-17 | Local working database | MariaDB `CMMS_putterdb` | `node tools/migrate-roles.js --apply` | PASS (SCHEMA) | changed=true; needed before=true, after=false; 1 admin and 4 technician accounts before and after. Application RBAC enforcement NOT YET IMPLEMENTED. |

| 2026-11-17 | a5398d5 checkout | Lenovo Linux Mint | `npm test` and `npm run build` | PASS | 61/61 tests passed, 0 failures (1615.529071 ms); static site prepared in dist/. State projection tests are unit-only; API integration NOT RUN. |

| 2026-11-17 | 12c326a checkout | Lenovo Linux Mint | `npm test`, `node --check server/api.js`, `npm run build` | PASS | 61/61 tests, 0 failed (1658.439282 ms); server syntax check passed; static site built. Authenticated API endpoint not yet tested. |

| 2026-11-17 | live local server port 3002 | Lenovo Linux Mint | unauthenticated `GET /api/my/work-orders` after restart | PASS | HTTP 401, `Login required`, `REQUEST_REJECTED`. Authenticated technician and other-role tests NOT RUN. |

| 2026-11-17 | live local server port 3002 | Lenovo Linux Mint | technician login and `GET /api/my/work-orders` | PASS (single-user positive case) | Existing `david` technician authenticated; HTTP 200; one assigned WO (`WO-2026-XTEZK`) matches session personId; empty assets/locations, limited people profile. Cross-technician isolation and legacy `/api/state` bypass NOT RUN. |

| 2026-11-17 | live local server port 3002 | Lenovo Linux Mint | technician `GET /api/state` count-only inspection | INCONCLUSIVE / SECURITY GAP OPEN | HTTP response revision 9: 1 WO, 1 person, 0 assets/PO/cost entries. These counts do not prove ownership filtering; legacy endpoint remains unrestricted in source. |

| 2026-11-17 | 94cb684 checkout | Lenovo Linux Mint | `node --test tests/state-projection.test.js` | PASS | 9/9 tests passed, 0 failures (146.692379 ms). Merge logic remains staged; API integration NOT RUN. |

| 2026-11-17 | e9fdcc4 checkout | Lenovo Linux Mint | `node --test tests/state-projection.test.js`; `node --check server/api.js` | PASS | 10/10 security unit tests passed, 0 failures (161.015102 ms); syntax check produced no errors. Live integrated API test NOT RUN. |

| 2026-11-17 | live local server port 3002 after restart | Lenovo Linux Mint | authenticated technician `GET /api/state` | PASS (limited scope) | Existing technician `david` logged in; no API error, 1 assigned WO, 1 employee, 0 audit records; settings keys `facility` only. Multi-technician isolation and transactional PUT preservation not yet live-tested. |

| 2026-11-17 | live local server port 3002 | Lenovo Linux Mint | technician `PUT /api/state` with revision -1 | PASS | HTTP 409 and expected stale-revision message; request rejected before persistence. Successful PUT preservation still NOT RUN. |

| 2026-11-17 | isolated CMMS port 3003, `CMMS_v12_restore_test` | Lenovo Linux Mint | technician unchanged-state `PUT /api/state` | PASS | HTTP 200, no API error, full JSON state before/after identical; 1/1 work orders, employees, settings and financial records preserved. Actual field update and cross-technician isolation NOT RUN. |

| 2026-11-17 | isolated CMMS port 3003, `CMMS_v12_restore_test` | Lenovo Linux Mint | technician actual completionNotes update and restoration, Steps 100–101 | PASS | Authenticated technician saved test marker HTTP 200 revision 11; GET verified marker persisted; restoration PUT HTTP 200 revision 12; subsequent GET verified original empty note restored. Cross-technician isolation NOT RUN. |

| 2026-11-17 | isolated `CMMS_v12_restore_test` | Lenovo Linux Mint | technician identity-link fixture correction, Steps 102–107 | PASS (fixture only) | Four technician logins initially shared one personId and only one employee record. Isolated test accounts now have four unique personIds; JSON people corrected from STRING to ARRAY; three duplicate fixture entries removed; final four unique employees and all account links match, revision 14. Cross-account authorization NOT RUN; production account links unchanged. |

| 2026-11-17 | isolated `CMMS_v12_restore_test` | Lenovo Linux Mint | Step 108 second-owner test fixture | PASS (fixture only) | Added temporary WO-V12-ISOLATION-TEST assigned to anthony; existing WO-2026-XTEZK remains assigned to david; total 2 WOs, revision 15. Cross-technician read/write authorization NOT RUN. |

| 2026-11-17 | isolated CMMS port 3003, `CMMS_v12_restore_test` | Lenovo Linux Mint | Step 109 technician cross-account read isolation | PASS | Authenticated david: GET `/api/state` and GET `/api/my/work-orders` both HTTP 200; each returned only WO-2026-XTEZK, excluded anthony's WO-V12-ISOLATION-TEST. Cross-account write denial NOT RUN. |

| 2026-11-17 | isolated CMMS port 3003, `CMMS_v12_restore_test` | Lenovo Linux Mint | Step 110 forged unassigned WO write rejection | PASS | Authenticated david submitted extra forged work order via PUT `/api/state`: HTTP 403 `Work order scope mismatch`; complete JSON database state unchanged; 2 WOs preserved. This is a forged-ID rejection, NOT a test using anthony's actual WO ID. |

| 2026-11-21 | Disposable database `CMMS_RBAC_IT_*`, isolated port 3097 | Lenovo Linux Mint | Six-role authenticated HTTP API integration: operational/finance projections, manager creation, supervisor assignment, unauthorized requests, stale revisions, audit and journal persistence | PASS | 20/20 integration checks; disposable database dropped on completion. `npm run test:integration:rbac`. |
| 2026-11-21 | Source regression suite | Lenovo Linux Mint | Unit/security tests and static build | PASS | 80/80 automated tests; `npm run build` successful. Production DB not changed. |

| 2026-11-21 | Disposable `CMMS_ROLE_IT_*` MariaDB database | Lenovo Linux Mint | Six-role schema compatibility, legacy migration, idempotence, credential preservation, guarded rollback and full restoration | PASS | 10/10 checks; database dropped after test; `npm run test:migration:roles`. |
| 2026-11-21 | Restricted front-end workspaces | Lenovo Linux Mint | Manager/supervisor/coordinator/finance-admin allowlisted UI, escaped operational display and role-specific actions | PASS (unit) | 83/83 unit tests after updating operational projection contract; build and 20/20 isolated API integration checks passed. Interactive browser acceptance remains outstanding. |
| 2026-11-21 | Disposable `CMMS_RBAC_IT_*` HTTP server | Lenovo Linux Mint | Browser module delivery: restricted-workspace and role-policy imports return HTTP 200; private server module blocked | PASS | 22/22 integration checks, 83/83 unit tests, build passed. Interactive browser acceptance not yet completed. |
