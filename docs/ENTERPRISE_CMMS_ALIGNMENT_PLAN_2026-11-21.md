# Enterprise CMMS Alignment and Delivery Plan
Version 1.0 | 2026-11-21 | Status: planning baseline, not production approval

## Purpose and authority
Align the existing Hospitality CMMS v1.2 with the Pragma On Key / IFS-inspired enterprise CMMS requirements, covering hospitality facilities and applicable South African requirements. Preserve all current code, MariaDB data, media, migrations, users and security controls. This document is a roadmap, not evidence that features are complete or certified.

## Source of truth
- Baseline: CMMS_Enterprise_Requirements_Specification_v1.docx and CMMS_Enterprise_Conformance_Register_v1.xlsx (184 requirements, issued in ChatGPT 2026-11-21). Keep these as controlled external artifacts until deliberately added to the repository.
- Current source: this branch, including cmms/README.md, cmms/USER_MANUAL.md, cmms/server/README.md, source and automated tests.
- cmms/PROCUREMENT_APPROVAL_AUDIT_SPEC.md explicitly says DESIGN / NOT ENABLED. Do not mark its workflows implemented without server-side evidence.
- Original Puter.js single-account mode and MariaDB shared mode are distinct and do not synchronise. Assess enterprise conformance against MariaDB shared mode.
- Historical test results (including work-order scope HTTP 403) are evidence for the tested behavior only; revalidate against current HEAD before release.

## Non-negotiable safeguards
1. No changes to production database, data, media, credentials, users, live services or deployments without a separate approved change.
2. No destructive SQL, schema reset, demo-data load, force push, branch rewrite or unreviewed migration.
3. Make a separate feature branch per delivery package; pull request into develop/v1.2-rbac-production-readiness. Do not merge directly into main.
4. Any schema migration must be additive where feasible, reversible or backed by a tested restore plan, and tested against a disposable database.
5. Keep secrets outside Git. Enforce authorization in server handlers, not just browser visibility.
6. Minimise repetitive testing: run targeted tests during development, one relevant regression suite at each release gate.

## Work packages and dependencies
### Gate 0 — evidence-based baseline (first)
- Confirm branch HEAD, test inventory, server architecture, schema/migration history, existing modules and role/permission model.
- Map every requirement ID from the 184-row Excel register to file/function/test evidence, or label NOT VERIFIED / DESIGN ONLY / GAP.
- Identify contradictions between older Puter docs, MariaDB mode and future-state specifications.
- Publish a traceability table with columns ID, requirement, priority, status, code path, test reference, owner, dependency, acceptance result.
- Exit: all 184 requirements classified with evidence; no unsupported completion claims.

### Gate 1 — production-readiness and security (P1)
- Unique employee-user mapping, RBAC and record-level work order scoping, least privilege, audit journal, validation and transactional consistency.
- Verify session management, password handling, API input validation, concurrent revisions, media access, backup+restore and deployment configuration.
- Exit: authorization bypass tests, stale revision tests, negative API tests and restore rehearsal pass in staging.

### Gate 2 — core operational maintenance (P1)
- Asset/location hierarchy and lifecycle; work request -> triage -> approve -> plan -> assign -> execute -> verify -> close.
- PM calendar and server-side scheduled issuance with idempotency, meter/runtime triggers, deferral approval, SLA/escalation and notifications.
- Labour capture, competence, shifts, attachments, checklists, stock reservations/issues and reconciled WO costs.
- Exit: integrated hospitality maintenance scenarios pass without manual database edits.

### Gate 3 — safety, compliance and hospitality (P1)
- Statutory inspection register, permit-to-work, LOTO/isolation references, qualifications, contractor induction and evidence retention.
- Room/area availability and hotel/casino/energy centre/water plant/sewage plant/kitchen/fire/HVAC asset templates.
- South African requirements matrix: OHSA and applicable regulations, relevant SANS, BCEA, POPIA and finance/VAT controls; obtain competent legal/technical review before claiming compliance.
- Exit: approved test cases, overdue alerts and traceable compliance evidence; no software-generated statutory certification claims.

### Gate 4 — inventory, purchasing and enterprise financial controls (P1/P2)
- Requisition -> distinct supervisor/manager approval -> store issue; PO -> quote -> approval -> receipt; segregation of duties.
- Atomic stock movements, no negative stock, idempotent issuance, document access controls, ZAR/VAT treatment, finance reconciliation.
- Implement cmms/PROCUREMENT_APPROVAL_AUDIT_SPEC.md only after server-side workflow and abuse tests pass.
- Exit: self-approval, duplicate issue, missing quote, altered request, stale revision and unauthorised API tests pass.

### Gate 5 — mobile, integration and reliability (P2/P3)
- Responsive technician workflow, secure offline queue and conflict resolution; REST API/webhooks; ERP/BMS/SCADA/IoT adapters.
- MTBF/MTTR, failure taxonomy, RCA, FMEA, condition monitoring and lifecycle forecasting.
- Exit: contract tests, offline resync tests, analytics reconciliation and documented operational limits.

## Release sequencing
Release A: Gate 0 + Gate 1; Release B: Gate 2; Release C: Gate 3 + Gate 4; Release D: Gate 5. Estimate effort only after Gate 0 evidence and dependency review. Each release requires a reviewed PR, change log, security tests, UAT evidence, rollback plan and explicit deployment approval.

## Definition of done per requirement
Implementation present in correct MariaDB-backed mode; role-scoped server enforcement; validated data and error paths; targeted automated test; documented user workflow; acceptance evidence; no regression of previously verified functions. 'Documented' and 'tested historically' are not equivalent to 'conformant'.

## Immediate next action
Perform Gate 0 read-only repository inspection and reconcile the 184-row register; propose the smallest Gate 1 pull request. No production mutation.
