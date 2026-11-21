# CMMS Commercial Cost and Billing Model
2026-11-21 | Planning assumptions | ZAR, excl. VAT

## Basis
Initial blended development benchmark: R750/hour (indicative, not an actual time record). Earlier planning model:
| Package | Hours | Rate | Amount |
|---|---:|---:|---:|
| Audit | 120 | 650 | 78,000 |
| Security / RBAC | 280 | 750 | 210,000 |
| Core maintenance | 400 | 700 | 280,000 |
| Hospitality / SA compliance | 360 | 750 | 270,000 |
| Procurement / finance | 300 | 850 | 255,000 |
| Mobile / integrations / reliability | 260 | 800 | 208,000 |
| **Total** | **1,720** | | **1,301,000** |
20% contingency: R260,200; initial non-AI total: R1,561,200.

AI incremental allowances: integration R90,000; security/evaluation R30,000; initial API R36,000; infrastructure/monitoring R24,000. AI subtotal R180,000; updated combined subtotal R1,481,000; contingency R296,200; combined budget R1,777,200.

## Commercial treatment
Development cost != automatically invoiceable revenue. Maintain actual time ledger (date, developer, task, requirement ID, hours, rate, approval), expense ledger (supplier invoice, currency, FX, taxes), milestone acceptance and change orders. The rate and hours above are planning assumptions only.

AI development tooling/subscriptions used by developers should be recorded separately from AI API consumption by the deployed CMMS. Avoid double counting. For provider usage, record model, tokens/requests, unit cost, FX, client/site, limits and actual billed amount. AI unit economics and gross margin should be recalculated after a pilot.

## Invoicing policy
No invoice without signed scope, legal supplier/customer identities, approved milestone or subscription and valid tax treatment. Draft invoices must not masquerade as issued tax invoices. Client-funded work, internally funded R&D and licensing are distinct commercial cases. Confirm IP rights before any offer.

## Baseline
Proposal: docs/CMMS_AI_COMMERCIAL_PROPOSAL_2026-11-21.md
Technical plan: docs/ENTERPRISE_CMMS_ALIGNMENT_PLAN_2026-11-21.md
