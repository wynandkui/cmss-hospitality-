# CMMS implementation and acceptance progress

Last updated: 2026-11-17. Project: `wynandkui/cmss-hospitality-` / `cmms/`.
Local runtime: Lenovo Linux Mint, MariaDB `CMMS_putterdb`, Node API `127.0.0.1:3002`.
This file records observed results separately from planned work.

## Confirmed locally

- MariaDB schema check found `cmms_state`, `cmms_transactions`, `cmms_gl_accounts`, `cmms_gl_journals`, `cmms_gl_lines`, `cmms_supplier_invoices`, `cmms_accounting_periods`, `cmms_bank_reconciliations`; chart of accounts had 13 entries and the pre-existing transaction table had 2 records.
- Accounting reports initially produced HTTP 500, later displayed successfully. A R0.01 test journal and its reversing entry appeared in the trial balance; both accounts returned to net zero. This demonstrates a narrow posting/reversal test, not complete financial acceptance.
- Non-stock draft PO `PO-A5712EDF-860` created for supplier `abc` / `globes`; net R875.00, VAT R131.25. The PO remained Draft during the document UI tests.
- PO Documents dialog lists an existing test attachment, metadata, and View / Download. User confirmed this works.
- Supplier selection exposes its related PO and the PO's quotation attachment. User confirmed both visible.
- Supplier tax-invoice upload section and supplier-scoped document selector displayed correctly.
- PDF tax-invoice upload failed before a MIME validation fix, then **user confirmed upload works** after commit `c26225b` on 2026-11-17.
- Test files were arbitrary documents used solely for software testing, not validated procurement evidence.

## Implemented but not fully acceptance-tested

- Admin-only chart of accounts, double-entry journals, supplier invoices, VAT treatment, accounting period closure, bank reconciliation summary and financial reports.
- Server-side supplier/PO, quotation/PO and tax-invoice document/supplier linkage validation.
- File type restrictions and private document storage.
- Automated CI checks are separate from laptop MariaDB integration; do not treat CI alone as production acceptance.

## Outstanding / next steps

1. Confirm uploaded tax-invoice filename remains selectable after reload and is associated with the intended supplier.
2. Verify PO/receipt/invoice matching and procurement approval lifecycle, including non-stock purchases.
3. With explicit approval and a database backup, run a controlled invoice-posting acceptance test; verify journal lines balance, VAT handling, duplicate rejection, and audit trail. Avoid uncontrolled live postings.
4. Improve document preview/download and metadata where needed; keep quotation and tax-invoice categories separate.
5. Complete statutory accounting controls (credit notes, reversals, supplier reconciliation, bank transaction matching, output VAT, VAT201 review, closing entries, opening balances and accountant approval).

## Resume instructions

User prefers **one numbered step at a time**, complete copy-paste commands, minimal resource use, and no redundant re-tests of already confirmed functionality. Stop the running Node server before restart (port 3002 must not be occupied by a second instance). For source updates: `cd ~/cmss-hospitality-/cmms && git pull origin main && CMMS_PORT=3002 npm run server`. Back up the database and private media before migrations or financial acceptance testing. Do not claim full South African statutory compliance.

Detailed operating instructions: [USER_MANUAL.md](USER_MANUAL.md), section 52.
