# Hospitality CMMS — Delivery Forecast and First Release Plan
Date: 2026-11-21 | Version 1.0 | Status: preliminary forecast, subject to Gate 0 audit

## Executive forecast
- **First controlled pilot release (R1): March–April 2027** assuming dedicated ~40 productive engineering hours/week, prompt decisions and no major architectural rewrite.
- **Full enterprise target (R4): December 2027** under the same staffing assumptions and with scope held to the controlled 184-requirement baseline.
- These are forecasts, not approved release dates, commitments, or proof of current conformance.
- At materially lower capacity, dates extend. See capacity scenarios.

## Evidence available as of forecast
- Existing v1.2 GitHub branch `develop/v1.2-rbac-production-readiness` and documented Node/MariaDB shared-mode application, core work order/asset/PM/inventory workflows.
- Recorded prior tests include employee deduplication, valid technician links, technician-specific work-order visibility and an unauthorised out-of-scope API mutation returning HTTP 403 without changing the database.
- Historical results are not a fresh branch HEAD regression or deployment approval.
- PM plans/calendar exist but unattended server-side PM issuing is not established.
- Procurement approval/audit document is DESIGN ONLY, not proven implementation.
- 184-item requirements register status at baseline: 13 verified in recorded tests, 55 documented/unverified, 5 design specified/unverified, 111 gap/not demonstrated. These are evidence classifications, **not percentage completion**.
- Baseline documents are controlled external Word/Excel artifacts; do not invent specific requirement IDs without opening them.

## Remaining effort model
The commercial costing model estimates **1,720 engineering hours** for non-AI enterprise alignment:
- Audit 120 h
- Security / RBAC / production-readiness 280 h
- Core maintenance / assets 400 h
- Hospitality / South African compliance 360 h
- Procurement / finance 300 h
- Mobile / integrations / reliability 260 h
Total 1,720 h. The AI proposal adds R90,000 engineering, R30,000 security/evaluation and operating allowances; its engineering effort was not yet estimated in hours. For scheduling only, reserve **160–240 additional AI engineering/evaluation hours** pending detailed breakdown. Thus planning engineering envelope **1,880–1,960 h**, excluding a separate schedule contingency. Do not double-count AI engineering if absorbed in other work packages.

## Delivery assumptions
- 40 **productive** engineering hours per week available to the project, one full-time-equivalent engineer or equivalent team throughput; no assumption that AI assistance guarantees this throughput.
- Requirements owner available for approvals; staging/test environment and backups available; no extended holidays, procurement delays or external certification lead times.
- Effective project start: Monday 2026-11-23.
- 20% schedule contingency applied to engineering effort for uncertainty; external review, onboarding and approvals may add elapsed time.
- Dates below are calendar targets, not generated from verified velocity.

## Scenario analysis
| Productive engineering capacity | Base 1,880–1,960 h | With 20% schedule contingency | Implication |
|---|---|---|---|
| 10 h/week | 188–196 weeks | 226–235 weeks | Full delivery roughly 2031; part-time pace |
| 20 h/week | 94–98 weeks | 113–118 weeks | Full delivery roughly Q1 2029 |
| 40 h/week | 47–49 weeks | 57–59 weeks | Full delivery roughly Dec 2027–Jan 2028 |
| 60 h/week | 31–33 weeks | 38–40 weeks | Full delivery roughly Aug–Sep 2027, if parallelism supports it |
The **December 2027** enterprise target is the optimistic edge of the 40 h/week + contingency scenario; **January 2028** is a prudent schedule reserve. At 40 h/week, a 16–20-week controlled pilot corresponds to ~640–800 productive engineering hours, including requirements/security and a narrowly selected operational slice; this must be re-estimated after Gate 0.

## Proposed delivery gates
| Gate / release | Target window | Entry/exit |
|---|---|---|
| Gate 0: source audit and 184-item traceability | 23 Nov–18 Dec 2026 | Every requirement classified with file/test evidence; actual effort and critical-path estimate revised |
| Gate 1: identity/security/production readiness | Dec 2026–Feb 2027 | RBAC, scoped API, audit, backups/restore, migration safety, staging tests pass |
| R1: controlled pilot / limited operational release | Mar–Apr 2027 | Core asset, request/WO, technician scope, PM issuance and essential reports verified; approved UAT and rollback |
| R2: core enterprise maintenance | May–Jul 2027 | Asset lifecycle, PM automation, labour, stock and costs accepted |
| R3: hospitality, SA compliance and purchasing | Aug–Oct 2027 | Site templates, safety evidence, procurement/finance controls and approved legal/technical review |
| R4: AI, mobile, integrations and reliability | Nov–Dec 2027 (reserve Jan 2028) | AI governance, metered cost caps, integration tests, mobile sync, reporting, final UAT and controlled deployment |

Windows overlap intentionally: requirements/security work may continue into pilot preparation, but release acceptance is sequential. R1 is **not** full enterprise conformance.

## R1 scope and acceptance (provisional)
1. MariaDB shared-mode deployment, verified role/record authorisation, session protection and audit trail.
2. Create/manage assets and locations; request, triage, assign, execute and close work orders with scoped technicians.
3. PM planning with idempotent server-side issuance (if feasible within pilot budget; otherwise remove from R1 and disclose limitation).
4. Essential attachment handling, reports, data export, backup and restore.
5. Negative permission tests, migration test on disposable database, targeted integration tests, pilot UAT and documented rollback.
6. No production cutover or customer invoice without explicit sign-off and contract.

## Risks and decision points
- Unknown current source completeness, actual test pass rate at HEAD, migration safety and integration dependencies.
- No measured development velocity; projected hours are estimates, not timesheets.
- Compliance review and third-party integrations may be critical-path constraints.
- AI model/API costs and engineering workload depend on actual workflows, provider and data governance.
- Historical tests do not establish production compliance or data security certification.
- Gate 0 must replace estimates with requirement-level story points/hours, dependencies, named owners, weekly burn-up and revised dates.

## Tracking and reporting
Weekly: planned/actual productive hours, requirements verified (not just documented), critical defects, automated test status, milestone forecast, budget spent/committed, AI API costs, blockers, change requests.
Use the 184-item register as scope control; record test IDs and evidence links.
No destructive SQL, production changes, deployment, force pushes or merges without explicit approval.

## Related project documents
- `docs/ENTERPRISE_CMMS_ALIGNMENT_PLAN_2026-11-21.md`
- `docs/CMMS_COSTING_BILLING_MODEL_2026-11-21.md`
- `docs/CMMS_AI_COMMERCIAL_PROPOSAL_2026-11-21.md`
