# CMMS Gate 0 — Disposable MariaDB integration evidence

Date: 2026-11-21 (SAST)
Branch: `develop/v1.2-rbac-production-readiness`
Scope: local Linux Mint CMMS development checkout, isolated MariaDB 10.11.19 container. This document records observed results, not production certification.

## Isolation and safety

- MariaDB test container: `cmms-mariadb-test`, private bridge `cmms-test-private`, address `172.30.77.10:3306`.
- Fixture database: `CMMS_v12_restore_test`; synthetic employee `it_person` and synthetic technician account `fixture_migration_account`. No production records were copied.
- Test credentials are stored outside the repository in the user's restricted `~/.config/cmms-test/` directory; **no secrets are recorded here**.
- The test-only `cmms/.env` was generated temporarily with restrictive permissions to satisfy existing test scripts, with `DB_NAME=CMMS_putterdb` as their configuration guard. The actual MariaDB host was the isolated container. Scripts cloned the fixture into randomly named disposable databases and removed them afterward.
- The CMMS fixture server was launched at `127.0.0.1:3098`. RBAC integration launched its own server at `127.0.0.1:3097`. No production services were deliberately changed.
- The existing `cmms/.env` did not exist before testing. The temporary file was removed by the shell exit trap.
- The untracked repository-root `.gitignore` was not modified or staged.

## Setup and fixture preparation

1. Node.js `v20.20.2`; package `cmms` declares `mysql2: ^3.15.0`.
2. Installed 12 dependencies with `npm install --no-save --package-lock=false --ignore-scripts --no-audit --no-fund`; `mysql2/promise` import succeeded.
3. Started the isolated CMMS API. `/api/status` reported `{"database":true,"detail":"MariaDB connected","initialized":false,"mode":"mariadb"}`.
4. Created synthetic employee `it_person` in `cmms_state.people` (one employee, revision 0).
5. Applied the project's explicit `applyRoleMigration(...,{confirm:true})` against the fixture only. Migrated the `cmms_users.role` enum from two to six roles; existing account count at that time was zero.
6. Added one synthetic technician account to the fixture to exercise migration rollback checks. Its randomly generated password was not retained in this report.

## Acceptance results

| Test | Final result | Evidence |
| --- | --- | --- |
| Role migration | **PASS 10/10** | Six-role schema, idempotence, legacy detection, explicit confirmation, data preservation, rollback protections and restoration |
| Backup / restore | **PASS 7/7** | Source baseline, SQL dump, restore into disposable DB, table inventory, row counts and SHA-256 comparison, critical tables, JSON state |
| RBAC integration | **PASS 55/55** | Six role sessions, browser workspace access, authorization and forbidden routes, work orders, PM plans, employee contact scope, finance postings, revision conflicts, audit and journal events |

Backup/restore dump: SHA-256 `220b4c104a391a8753f244f8a1997fc13208eac07e53b9347c65d33ffa840827`; 14,715 bytes; 12 tables. This validates the **known synthetic test fixture**, not any current production backup.

### Initial migration failure and resolution

The first migration run passed seven checks and then failed with `Cannot read properties of undefined (reading 'id')`. Root cause: `cmms_users` contained zero rows, while the rollback test accessed `original[0].id`. A synthetic technician account was added to the isolated fixture; rerun passed **10/10**. No application or test source modification was required.

### Cleanup and limitations

The migration, restore and RBAC scripts reported removal of their respective disposable databases. Test-only `cmms/.env` was scoped to command execution and removed on exit. The persistent fixture and its localhost test API may remain available for further testing.

These results establish only the three specified integration suites on the isolated fixture. They do not prove all 184 Gate 0 requirements, validate production credentials or data, or constitute a production deployment approval.

## Traceability policy from this checkpoint

For each subsequent material change, record the objective, affected files, commands or procedures, relevant safety constraints, exact observed test results, unresolved issues, and Git commit reference. Do not store credentials, session cookies, private employee data or unredacted environment files in Git.
