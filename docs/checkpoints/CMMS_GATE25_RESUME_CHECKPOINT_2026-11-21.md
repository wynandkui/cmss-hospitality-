# CMMS development conversation checkpoint — 2026-11-21

## Purpose
Durable GitHub-backed continuation point for the CMMS Gate 25 authorization audit. This is a **project conversation summary**, not a verbatim export of private ChatGPT messages.

## Environment and safety
- Repo `/home/wynand/Projects/CMMS/cmss-hospitality-`; app `cmms/`.
- Branch `develop/v1.2-rbac-production-readiness` on `wynandkui/cmss-hospitality-`.
- Work exclusively in guarded disposable MariaDB fixtures and loopback API; **no production deployment or live-data modification**.
- Test credentials stored in `~/.config/cmms-test/fixture.env`; never commit or print secrets. Temporary `cmms/.env` must be removed after tests.
- User requests efficient, batch-oriented testing, no redundant microchecking; document changes and push commits to GitHub.
- Existing untracked root `.gitignore` is user-owned and intentionally untouched.

## Completed and verified
- Gate 27 disposable database + synthetic media restore **9/9**, Git commit `bea4c7f`; operational full recovery remains open.
- Gate 25 quotation/supplier invoice metadata matrix **76/76 integration**, Git commit `ef3c902`.
- Gate 25 technician photo access hardened to administrator or owner technician; **77/77 integration**, Git commit `108a07f`.
- Latest separately executed baseline **198/198**: 102 unit/source + 77 integration + 10 migration + 9 restore; not a unified release pipeline.
- Previous security tests cover six-role reads, 60 denied privileged mutations, stale sessions, rollback and actual isolated API SIGKILL.

## Current task
Finish Gate 25 **record-level and capability-delegation authorization** for `/api/files` (asset, inspection, quotation, supplier invoice), `/api/files/:uuid` and procurement workflow; validate all dynamic endpoints and authorization paths. Record unresolved policy decisions rather than claiming unsupported completion. Then Gate 26 real TLS staging, Gate 27 operational recovery, Gate 28 signed hospitality UAT.

## Resume procedure
1. `git status -sb && git log -3 --oneline` in repo; preserve unrelated changes.
2. Review `cmms/server/api.js`, `cmms/src/procurement-security.js`, `cmms/tools/integration-rbac.mjs` and `docs/CMMS_RBAC_SECURITY_CONTINUATION_2026-11-21.md`.
3. Add targeted disposable tests and fixes; run one integration suite with `CMMS_RUN_DISPOSABLE_INTEGRATION=YES` and safe temporary `.env` pointing at `CMMS_putterdb` (harness creates unique `CMMS_RBAC_IT_*`).
4. Record evidence and outstanding risks; commit and push to branch; verify remote SHA. No production changes.
