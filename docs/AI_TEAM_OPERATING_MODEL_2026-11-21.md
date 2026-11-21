# CMMS AI Team Operating Model
2026-11-21 | Owner-approved operating direction; execution subject to configured tools

## Authority
- Project owner: final scope, budget, production, merge and release approvals.
- ChatGPT: lead development assistant, architect, coordinator and reviewer; cannot continuously monitor or autonomously invoke FreeLLMAPI without an authorised connected coding tool.
- FreeLLMAPI: model gateway supplying on-demand specialist role prompts; not a persistent autonomous team or separate developer capacity.
- One human developer at 20 productive hours/week remains the capacity baseline.

## Four on-demand roles
1. Code Developer: small feature patches on approved requirement IDs; must return diff, tests and risk.
2. QA Engineer: test plans, isolated regression scripts and failure analysis; no invented pass results.
3. Documentation/Traceability Analyst: 184-item mapping, release notes, acceptance criteria and documentation.
4. Security Reviewer: RBAC, input validation, data protection, threat review; no production secrets.

## Orchestration
Owner request -> ChatGPT task specification -> GitHub issue/task file -> external coding client + FreeLLMAPI role -> patch/test evidence -> ChatGPT review -> owner approval -> feature-branch PR -> CI/UAT -> authorised merge.
Do not assume ChatGPT can automatically call an external FreeLLMAPI server from this conversation. User or authorised coding client must execute and return results.

## Token and cost controls
- Start with one model, sequential roles, zero always-on agents.
- Use short shared context and relevant file excerpts; never resend full conversation.
- 1 requirement / 1 task / 1 agent per run. Limit output to 500–900 words unless code needed.
- Cache repo/branch/HEAD, requirement ID, files, previous findings in a compact handoff.
- Use local deterministic tools for grep, unit tests and formatting instead of model tokens.
- Escalate uncertain security/architecture only; avoid redundant reviews.
- Log per task: model, tokens in/out, estimated ZAR, duration, human hours saved, accepted changes.
- Apply provider rate caps and monthly hard budget before enabling paid calls; stop on cap.
- Avoid sending customer data, credentials or sensitive logs to external model providers.
- No auto-merge, force-push, production DB changes, deployment or purchase approvals.

## Gate 0 first batch
A. Traceability Analyst: first 20 P1 requirements, exact code locations and missing evidence (read-only).
B. QA: review test scripts and non-DB isolated test plan (read-only).
C. Security: review scoped API/RBAC threat surface (read-only).
D. Code Developer: only after owner approves a specific issue and acceptance criteria.

## Weekly report
Verified requirements, tests executed, defects, actual human hours, model tokens and ZAR, changes awaiting review, revised release forecast. Baseline: R1 Aug–Oct 2027; enterprise Jan–Mar 2029 (provisional).
