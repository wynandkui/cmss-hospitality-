# Continuation prompt — Hospitality CMMS enterprise alignment
I am continuing the existing Hospitality CMMS v1.2 project in GitHub repository `wynandkui/cmss-hospitality-`, branch `develop/v1.2-rbac-production-readiness`.

Objective: Bring the current CMMS into conformance with the full enterprise specification based on Pragma On Key and IFS, including hospitality-specific functions and South African statutory/compliance controls. The controlled baseline is `CMMS_Enterprise_Requirements_Specification_v1.docx` and `CMMS_Enterprise_Conformance_Register_v1.xlsx` (184 requirements) from my ChatGPT conversation on 2026-11-21. Ask me to attach them if not accessible in this chat; do not invent requirement IDs or statuses.

Start by reading `docs/ENTERPRISE_CMMS_ALIGNMENT_PLAN_2026-11-21.md` on the development branch, then inspect actual repository source, tests, migrations and manuals. Distinguish original single-account Puter.js mode from the MariaDB shared mode. Treat `cmms/PROCUREMENT_APPROVAL_AUDIT_SPEC.md` as design only until implementation is proven.

First task (Gate 0): produce an evidence-based requirement-to-code-to-test gap matrix for all 184 requirements, clearly marking VERIFIED, IMPLEMENTED UNVERIFIED, DESIGN ONLY, GAP and NOT ASSESSED. Cite repository paths and tests. Prioritise the smallest safe Gate 1 security/identity production-readiness change.

Non-negotiable: preserve all existing source, production MariaDB data, media, users, credentials, service configuration and Git history. No production database access or migration, deployment, force push, destructive command or merge without my explicit approval. Use feature branches and reviewed PRs. Test changes against disposable data. Do not claim compliance or completion based solely on documentation. Avoid redundant tests; one numbered step at a time, complete copy-paste commands when necessary, and wait for my result before the next operational step.

Deliver the next concrete action and report what is already verified versus unknown.