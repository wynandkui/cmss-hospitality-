# Gate 0 — Read-only requirements traceability

**Status:** Tooling implemented on feature branch; 184-row production-baseline run pending. This is NOT an accepted conformance report.

## Inputs and protection
Use the approved version 1.0 workbook `CMMS_Enterprise_Conformance_Register_v1.xlsx` from the controlled external artifacts. Keep the original unchanged and outside the repository. The script uses only Python standard library, reads repository tracked code and tests, and never connects to MariaDB. It writes only the explicitly specified output folder.

## Run (from repository root)

```bash
python3 cmms/tools/gate0-traceability.py \
  --baseline '/path/to/CMMS_Enterprise_Conformance_Register_v1.xlsx' \
  --output '/tmp/cmms-gate0-assessment'
```

Output: `gate0-traceability.csv` (184 rows) and `gate0-summary.json` (baseline SHA-256, source commit, branch, counts). It rejects wrong headers, duplicate/missing IDs, changed initial verdicts and invalid priorities. Every formal verdict remains NOT ASSESSED until reviewed acceptance evidence is entered. Source/test paths are **lexical hints only**, not evidence that a requirement is implemented or tested. No workbook, production data or deployment is modified.

## Automated verification

```bash
python3 cmms/tools/test-gate0-traceability.py
```

GitHub Actions runs the isolated synthetic 184-row importer test on relevant PRs. No production secrets, database or network access are required.

## Human review required to finish Gate 0
1. Run against the actual controlled Excel workbook and confirm SHA-256 and all 184 IDs.
2. Inspect source and test evidence requirement by requirement; classify VERIFIED / IMPLEMENTED, UNVERIFIED / DESIGN ONLY / GAP / NOT ASSESSED.
3. Record owners, dependencies, acceptance tests and blockers; prioritize P1.
4. Review the first Gate 1 PR scope before authorizing implementation.

**Limitation:** This is an evidence-discovery scaffold, not an automated conformance decision engine. Do not promote lexical matches to VERIFIED.
