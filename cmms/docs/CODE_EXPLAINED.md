# CMMS — Living code explanation
Version: v1.2 development. Updated: 2026-11-17.

## Architecture
- `src/main.js`: single-page UI, navigation, forms, role-sensitive screens and API calls.
- `src/core.js`: state schema, normalization, work-order and PM calculations; includes `demoState()` for operational examples.
- `src/finance.js`: purchasing, stores, vendors and finance UI.
- `src/accounting.js`: accounting UI, reports, supplier statement and print views.
- `src/procurement-security.js`: current capability checks and procurement approval transitions.
- `server/api.js`: HTTP API, sessions, MariaDB persistence, accounting journal posting, audit and file storage.
- `server/accounting-engine.js`: cent-accurate postings and double-entry validation.
- `tests/*.test.js`: Node built-in test runner; `npm test` executes all unit tests.

## Data flow
Browser login → server validates password hash → HttpOnly session cookie → authenticated API request → server authorization → transaction/validation → MariaDB → audit trail → UI refresh.

## Critical distinction
Hiding a button is usability, not security. A server route must reject unauthorized operations even when called directly. Work-order ownership and financial segregation require filtering/authorization at the data layer.

## Existing implementation notes
- User table currently has an ENUM for administrator and technician only. Schema migration required.
- Existing administrator-only finance endpoints must be revised to accept Finance Admin while denying other roles.
- State PUT is a broad snapshot update; role-specific field-level validation must prevent tampering.
- Existing `demoState()` is an operational sample, not a full accounting/demo-login fixture.

## Change history
| Date | Area | Explanation | Test evidence |
|---|---|---|---|
| 2026-11-17 | Role migration (not applied) | `server/role-migration.js` inspects the legacy enum and expands allowed roles without dropping user records; `tools/migrate-roles.js` defaults to dry-run and requires `--apply` for DDL. MariaDB ALTER TABLE is not generally transaction-rollback safe; take a verified backup before applying. | Tests committed, not executed |
| 2026-11-17 | Role policy foundation | `src/role-policy.js` declares six roles and fail-closed action/ownership checks; not yet wired into API, no migration or live access change | Unit tests committed; execution pending |
| 2026-11-17 | v1.2 planning | Isolated development branch, acceptance register and release gates introduced | Not yet executed |

## Documentation rule
Every successful implementation change must explain the altered functions, security implications, migration impact and test evidence here before merge.

### v1.2 read-projection foundation (staged; not wired to API)
`src/state-projection.js` introduces `projectStateForSession`, which returns a filtered snapshot for technician sessions (only assigned work orders, referenced assets, minimal employee record; excludes procurement/finance and other modules). Administrator receives the original content as a copy. Other roles are deliberately denied until their projections are designed. `tests/state-projection.test.js` checks privacy, ownership, unknown roles, and non-mutation. **Important:** This is not yet integrated with `/api/state`; changing GET alone would break the legacy full-snapshot PUT contract. A coordinated read/write API change and live integration tests are required before enforcement is claimed. Tests not yet run.

### v1.2 technician-only read endpoint (staged)
`server/api.js` now exposes authenticated `GET /api/my/work-orders` exclusively for `technician` sessions. It invokes `projectStateForSession` and returns assigned work orders, relevant assets/locations, and limited employee data, not the full state snapshot. Other roles receive HTTP 403. The existing `/api/state` GET and PUT remain unchanged to avoid breaking the legacy full-state client; **this new endpoint is not yet used by the UI and does not fix the legacy GET data-exposure risk**. API integration/security tests pending; do not mark server-side RBAC production-ready.
