# Gate 29 — bounded security readiness assessment (2026-11-21)

## Scope and evidence

This is a **development-security checkpoint, not production authorization**. The current server defines 38 static HTTP method/path branches (16 GET, 18 POST, 3 PATCH, 1 PUT) plus four dynamic media method branches (technician-photo GET/PUT, file GET/DELETE). Static counts exclude the generic unknown-API fallback and static asset serving. These are code-structure counts, **not** a claim that every route has exhaustive positive/negative authorization tests.

The disposable MariaDB suite exercises six roles, privileged read and mutation denial, session deactivation, database revocation, transaction locking, attachment access and crash detection. This continuation adds a dynamic scope-revocation test: after a technician has authenticated, an assigned work order is reassigned to a different employee **directly in the disposable database**. Both asset and inspection attachment listing and direct-download access must immediately change from allowed to HTTP 403, while the manager retains access. The original synthetic state is restored before the remainder of the suite. **Five decisions verified.**

**Executed result:** `INTEGRATION PASS 83/83`, exit 0, `/tmp/cmms-gate29-reassignment.log`. Temporary DB and `.env` cleaned. Latest separately executed suite baselines: unit/source 102/102, integration 83/83, migration 10/10, restore 9/9 = **204/204**. This sum is not a fresh all-suites run.

## Decision register (bounded)

| Gate | Assessment | Release consequence |
|---|---|---|
| 25: RBAC | Negative matrices and current asset/inspection scope tested; dynamic reassignment revokes technician media visibility | **Open:** business must approve asset-level sharing and globally delegated quotation access; independent full endpoint review |
| 26: TLS | Real ephemeral loopback Node TLS proxy tested; Host and Origin denial and secure cookie verified | **Open:** intended Nginx reverse proxy, trusted certificates, DNS, browser session and upstream isolation acceptance |
| 27: Recovery | Disposable DB and media restore plus integrity and crash orphan diagnostics tested | **Open:** agreed RPO/RTO, coordinated operational backups, timed application recovery and operator sign-off |
| 28: Pilot | Technical foundation exists | **Open:** hospitality UAT, load testing, independent security review, maintenance ownership and deployment authorization |

## Residual race and policy boundaries

- Current reassignment test proves authorization is recomputed on **subsequent requests**. It does **not** prove cancellation of a download already in progress when assignment or account status changes mid-response. Database account checks for media reads do not hold a lock until response completion.
- An in-flight write/account-revocation serialization test exists; it does not enumerate every transaction/role interleaving. Existing lock-order deadlock detection is a warning, not proof of deadlock-free operation.
- An attachment upload interrupted by SIGKILL can leave an orphaned file. Read-only detection is tested; operator-controlled reconciliation remains required.
- Exact Host allowlisting is optional if `CMMS_ALLOWED_HOSTS` is unset; it must be configured and validated for deployment.
- No tests here establish data classification, POPIA retention compliance, performance under load, or certified production disaster recovery.

**Decision:** NOT READY FOR PRODUCTION OR UNCONTROLLED PILOT. Continue only with approved staging infrastructure and explicit business policy decisions. Do not repeatedly rerun passing suites without a code or configuration change requiring it.
