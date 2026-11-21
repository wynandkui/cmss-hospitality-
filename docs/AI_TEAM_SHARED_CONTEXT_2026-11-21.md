# CMMS AI Team Shared Context — Minimal Token Brief
Repository: https://github.com/wynandkui/cmss-hospitality-
Branch: develop/v1.2-rbac-production-readiness
Root: cmms/
Capacity: 1 human developer x 20 productive hours/week
Release forecast: R1 pilot Aug–Oct 2027; enterprise Jan–Mar 2029; provisional
Scope: 184 requirements benchmarked against Pragma On Key / IFS, hospitality, South African compliance.
Modes: Puter.js single-user and separate Node/MariaDB shared mode; no synchronisation.
Important code: cmms/server/api.js; cmms/src/role-policy.js; cmms/src/procurement-security.js; cmms/tools/integration-rbac.mjs; cmms/tools/test-role-migration.mjs; cmms/tools/test-backup-restore.mjs.
Evidence: historical technician isolation and 403 negative test; no fresh current-HEAD tests yet. Procurement design disclaimer conflicts with newer imported security modules; inspect actual implementation.
Status: Gate 0 static traceability candidate mapping; 184/184 indexed, 0/184 current-HEAD verified. Controlled Excel register must be supplied if unavailable.
Safety: read-only first; no production credentials/data; no DB tests without explicit approval; separate branch and reviewed PR for changes.
Required handoff: task ID, HEAD, exact files/lines, verified vs inferred, tests actually run, findings, estimated hours, next approval.
