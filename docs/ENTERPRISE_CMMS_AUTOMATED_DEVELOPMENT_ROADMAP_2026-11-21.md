# Hospitality CMMS v1.2 — Enterprise Development and Automation Roadmap
Version 1.0 | 2026-11-21 | Controlled delivery proposal | NOT production approval

## Authority and baseline
Follow `docs/ENTERPRISE_CMMS_ALIGNMENT_PLAN_2026-11-21.md`. Source of truth: `CMMS_Enterprise_Requirements_Specification_v1.docx` and `CMMS_Enterprise_Conformance_Register_v1.xlsx`, version 1.0, 184 immutable requirement IDs across 13 modules. Retain both baseline documents unchanged; maintain a separate evidence register. Original register classifications are not current acceptance verdicts. Assess MariaDB shared mode; legacy Puter mode is not enterprise evidence.

## Phased roadmap (provisional estimates)
| Gate | Delivery | Indicative effort | Exit evidence |
| --- | --- | --- | --- |
| 0 | Read-only requirement traceability, gap and dependency assessment | 1–2 weeks | 184/184 IDs reconciled with source/test evidence, owner, priority, status, acceptance criteria |
| 1 | Identity, RBAC, security and production readiness | 2–4 weeks | Scoped access, session, audit, backup/media restore and staging security tests |
| 2 | Assets, work orders, PM, labour, contractors and spares | 6–10 weeks | Integrated maintenance lifecycle and scheduling tests |
| 3 | Hospitality operations, safety and SA statutory evidence | 4–7 weeks | Qualified review and traceable compliance evidence |
| 4 | Stores, procurement, finance and segregation of duties | 4–7 weeks | Transactional stock/approval/VAT abuse tests |
| 5 | Mobile, offline sync, reliability and integrations | 5–9 weeks | Offline conflict, contract and reconciliation tests |

Effort estimates are provisional; refine after Gate 0. Release A: Gates 0–1; Release B: Gate 2; Release C: Gates 3–4; Release D: Gate 5.

## Automated pipeline
1. **Baseline validation:** import approved 184-row register, check uniqueness and immutable IDs, priority and module, never rewrite controlled v1.0 originals.
2. **Evidence discovery:** match code paths and test names as *candidates*, not proof; preserve separate fields for baseline evidence and independently accepted conformance.
3. **PR checks:** run targeted unit tests, static build, relevant disposable MariaDB HTTP/browser tests, migration safety and dependency/secret checks. Run comprehensive suites at release gates rather than repeatedly.
4. **Traceability output:** generate a reproducible CSV/JSON and summary of requirement ID, priority, status, source, tests, dependencies, acceptance, owner and PR/commit.
5. **Review gates:** reviewer approves acceptance evidence; PRs target `develop/v1.2-rbac-production-readiness`. No automatic merge, deployment or production migration.

## Initial delivery packages
1. Gate 0: create import/validate/traceability generator and evidence matrix, inspect all 184 IDs, prioritize backlog.
2. Gate 1: verify unique technician-to-employee mapping and fail-closed ownership; read-only diagnostics first, then isolated tests.
3. Gate 1: session invalidation, reverse-proxy trust, TLS cookie and negative authorization tests.
4. Gate 1: encrypted DB+media recovery and RTO/RPO rehearsal.
5. Gate 1: staging acceptance and manual release decision.

## Safeguards
Never mutate production MariaDB, media, services, accounts, credentials or deployed artifacts without explicit separate authorization. No destructive SQL, schema reset, force push or automatic merge. Feature branch and reviewed PR per package. Secrets stay outside Git. Legal/technical review is mandatory for OHSA/SANS/POPIA assertions. Tests and documentation alone do not certify conformance.

## Metrics
Track verified P1 coverage, unresolved critical gaps, regression pass rate, requirements with accepted evidence, and release blockers. A requirement is VERIFIED only with executable acceptance evidence reviewed against its actual requirement and deployment mode.

## Gate 0 acceptance checklist
- [ ] Approved baseline artifacts available to traceability runner
- [ ] All 184 unique requirement IDs reconciled
- [ ] Every row has evidence-backed status or NOT ASSESSED
- [ ] Critical dependencies and P1 backlog reviewed
- [ ] First Gate 1 feature package approved

**Status:** Roadmap approved for implementation of Gate 0 automation only. This document does not authorize production changes or feature deployment.
