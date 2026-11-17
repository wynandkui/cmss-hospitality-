# CMMS procurement permissions, approvals, quotations and audit — implementation specification
Version: 2026-11-17 (design; NOT enabled until server-side enforcement and integration tests pass)

## Approval and separation of duties
- A technician has a unique login linked to one employee identity; administrator configures independent capability flags: requestStores, requestPurchase, approveSupervisor, approveManager, issueStores, receivePurchase, manageVendors, viewFinance, manageAudit.
- Default technician capabilities are all false until explicitly granted. Existing admin remains system administrator but must not silently count as both procurement approvers. Explicit delegated approver identities are required.
- For each requisition: Draft/Submitted → Supervisor approved → Manager approved → Issued by storeman. Supervisor and manager must be different users and neither can be requester; storeman cannot be requester or either approver for that requisition. Rejections capture reason, actor, timestamp. Changes after submission invalidate approvals and require resubmission.
- For each PO: Draft/Submitted → Supervisor approved → Manager approved → Approved for ordering → Received by authorised goods receiver. Supervisor and manager are distinct and neither is requester. PO changes invalidate approvals. Receiving and issue are separate inventory events.
- Issue slip includes requisition code, work order, stock code, description, unit, quantity, unit cost, issue timestamp, storeman, recipient (employee ID/name), and signature lines. Issue must be atomic, reject insufficient stock and be idempotent. Only issue after both approvals.
- Quotation(s) are private uploaded documents linked to PO ID, not shown in the ordinary Media navigation. Accept PDF/JPEG/PNG/WebP with content validation and size limit. Approval must show quotation list and allow authenticated view/download. Require at least one quote before approval unless an explicitly logged exception is authorised.
- All privileged operations MUST be checked server-side, not merely by hiding UI controls. Approval endpoints must verify logged-in user identity, capability, record status, separation of duties and current database revision inside a transaction. Never accept approver names or approval timestamps supplied by the browser.

## Technician administration
- Edit technician: role and capability checkboxes; username, employee details and photos remain individual. Capability changes are administrator-only, immediately invalidate active session permissions, and generate mandatory audit records.
- Provide read-only access to appropriate work orders and requisitions for authorised requester/storeman/approver accounts, without exposing confidential employee personal details.

## Audit trail
- Use a separate append-only MariaDB audit_events table, not the editable shared CMMS state array. Columns: id, occurred_at UTC, actor_user_id, actor_username, category, action, entity_type, entity_id, result, request_id, before_json, after_json, client_ip_hash. Enforce size limits, redact passwords, tokens, bank credentials, private photos and uploaded file bytes.
- Administrator-only Audit settings page with per-category toggles (workOrders, assets, stores, purchasing, vendors, users, media, finance, settings). Defaults enabled. Security-critical categories (login failures, permission changes, approvals, stock issues, purchase receipts, audit setting changes) are mandatory and cannot be switched off. Display explicit explanation.
- Admin-only audit search/filter by actor, category, action, date range and entity; CSV export. Never provide UI edit/delete operations for events. Use database-level restricted permissions and retention/backup policy.
- Record transactions only on successful database commit, with separate failed-action security events. Protect against spoofed events and tampering.

## South African financial controls
- ZAR currency and VAT separately tracked on supplier documents. Supplier quotation is not a tax invoice. VAT input claims require valid supplier tax invoices and correct tax treatment; not calculated solely from quotation/PO.
- Maintain sequential document numbering with uniqueness and no silent reuse. Require approvals before ordering and stock issue, receiving evidence and stock valuation. Financial reporting is an operational subledger until independently reconciled with the statutory accounting system.

## Delivery gates
1. Database migrations and server endpoints with permission and workflow enforcement; old records migrated safely and existing users default to least privilege.
2. Technician permissions UI, requester/approver/storeman pages, quotations, issue slips, audit settings/search.
3. Automated tests for unauthorised requests, duplicate approvals, self-approval, manager-before-supervisor, issue-before-approval, duplicate stock issues, stale revision, missing quote, rejected/edited records, audit toggle restrictions, and no sensitive data leakage.
4. Browser acceptance test against test data before production use; back up MariaDB and CMMS media first.
