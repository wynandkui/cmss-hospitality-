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
| 2026-11-17 | v1.2 planning | Isolated development branch, acceptance register and release gates introduced | Not yet executed |

## Documentation rule
Every successful implementation change must explain the altered functions, security implications, migration impact and test evidence here before merge.
