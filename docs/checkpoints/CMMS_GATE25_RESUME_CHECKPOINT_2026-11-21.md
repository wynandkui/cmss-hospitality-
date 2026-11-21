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

## Subsequent continuation — 2026-11-21
- Added direct file-download authorization matrix (14 decisions) and explicitly delegated quotation permission matrix (4 decisions). Integration suite **79/79**, evidence `/tmp/cmms-gate25-direct-delegated.log`; latest respective aggregate **200/200**.
- **Unresolved Gate 25 security issue:** asset and inspection attachments are readable by any authenticated role; record ownership not checked. Quotation capability grants global quotation access. Obtain explicit access-policy decision and implement scoped authorization before pilot.

## Attachment scope implementation checkpoint — 2026-11-21
- Added `cmms/src/media-access.js` and applied scope checks to listing and direct download for asset/inspection attachments.
- Admin and operational work-order-wide roles can view existing records; finance-only denied; technician limited to assets associated with own assigned work orders, with inspections linked by `assetId`.
- Disposable MariaDB integration **80/80**; 50 access decisions; `/tmp/cmms-gate25-record-scope.log`; latest respective aggregate **201/201**.
- Remaining policy: attachment visibility is **asset-level** (not individual work-order-level); global quotation delegation also remains subject to business sign-off. Gate 25 not finally signed off. Continue with Gate 26 TLS staging only after documenting these decisions; do not deploy to production.

## Gate 26 staging work checkpoint — 2026-11-21
- Gate 25 scoped media implementation committed as `5d3e3b2` and verified pushed; latest successful aggregate remains **201/201** across latest respective suites.
- Gate 26 work-in-progress: optional `CMMS_ALLOWED_HOSTS` exact Host allowlist with HTTP 421 on unknown hosts, and a synthetic hostile-Host integration probe. Added `src/host-security.js` with three directly passing policy decisions.
- **Important:** First attempted full integration with a forged Host header FAILED at check 5: expected HTTP 421, received HTTP 200. This is an unresolved test/environment or runtime discrepancy; do not count as a pass or claim Gate 26 complete. Test runner was terminated and temporary `.env` removed. A separate old `node tools/integration-rbac.mjs` process PID 439973 predates this work; do not kill unrelated user processes.
- Next: isolate Host header handling with raw `http.request`, inspect server process/port conflicts and test setup; rerun guarded suite once resolved. Then configure/test actual TLS terminator on disposable loopback and verify cookie, Origin and Host behavior end-to-end. No live deployment.

## Gate 26 continuation — 2026-11-21
- Replaced forged Host fetch probe with raw `node:http` Host override. Guarded integration **81/81**, evidence `/tmp/cmms-gate26-host-retest.log`; disposable DB and `.env` cleaned.
- Latest respective successful aggregate **202/202**.
- Prepared `cmms/deploy/staging/nginx.conf` and README for TLS terminator; **not deployed**. Nginx unavailable on laptop; actual TLS handshake remains a Gate 26 blocker.
