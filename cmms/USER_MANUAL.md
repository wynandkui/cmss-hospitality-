# Hospitality CMMS — Complete User Manual

**Application:** CMMS — Hospitality Facility Management  
**Version:** 1.0.0 · 17 November 2026  
**Platform:** Browser application, Puter.js v2 cloud KV, dependency-free static build  
**Audience:** Engineering managers, maintenance supervisors, planners, technicians, facility administrators, and compliance officers  
**Currency and date conventions:** South African rand (ZAR), ISO dates (YYYY-MM-DD), locally displayed dates

> **Operational classification:** This release is a practical **single-account maintenance application**, not an independently certified safety system or a centrally managed enterprise CMMS. Each authenticated Puter user's app data is private to that account. Do not distribute an account password to make a shared workspace. The calendar computes occurrences in the browser; it does not dispatch jobs or send automatic reminders in the background.

## Contents

1. System overview
2. Getting started and environment
3. Logging in and cloud storage
4. First-time configuration
5. Recommended implementation sequence
6. Dashboard
7. Locations and facility hierarchy
8. Teams and personnel
9. Asset register
10. Corrective and emergency work orders
11. Preventive maintenance (PM) plans
12. PM calendar and issuing work
13. Execution, checklists, close-out
14. Compliance and statutory inspection records
15. Meter readings
16. Inventory and spares
17. Reports and exports
18. Audit trail and record preservation
19. Backup, restore, and demonstration data
20. Worked hospitality example
21. Suggested asset taxonomy and PM catalogue
22. Roles, privacy, security, and operational controls
23. Deployment to a web host
24. Installation and development
25. Quality assurance and acceptance checklist
26. Troubleshooting
27. Business continuity and disaster recovery
28. Data dictionary
29. Current limitations and roadmap
30. External documentation and legal considerations

---

## 1. System overview

The application manages the facility maintenance lifecycle through related records. **Locations** are physical spaces or systems; **assets** are maintainable equipment installed in those locations; **people/teams** are resources; **work orders** document tasks, assignment, priority, findings, and completion; **PM plans** calculate recurring due dates; **compliance records** hold inspection/certificate metadata; **readings** record meter/condition observations; and **inventory** tracks stock balances and low-stock thresholds. Reports summarize the available records and export spreadsheets.

The app ships with an intentionally empty live database. A **demonstration facility** can be loaded for familiarization, but doing so replaces the active data.

## 2. Getting started and environment

Use current Chrome, Edge, Firefox, or Safari with JavaScript enabled. You need network access to `https://js.puter.com/v2/` and Puter services to sign in and store cloud data. The app must be opened over HTTP/HTTPS, not `file://`.

The repository's `cmms/` folder is the entire deployable source. For local development use Node.js 20+ with npm. The assembled `dist/` directory is the static website.

## 3. Logging in and cloud storage

1. Open the hosted app; click **Connect Puter** on the top bar.
2. Complete Puter account sign-in in the popup. Allow browser popups if prompted.
3. If that account already contains a CMMS dataset, the application loads it. If the current page already has unsaved records, a confirmation warns before replacing them.
4. The top bar shows **Puter cloud** and the account name when connected.
5. Changes save to one Puter KV key, `cmms-state-v1`, with a short debounce. Click **Sync now** before closing the browser when important changes are completed.

**Disconnected mode:** Before Puter sign-in, the app can be explored and edited in memory, but that data will be lost on browser refresh or page close. Download a JSON backup if you cannot connect. This is **not** a reliable offline-first sync system.

**Data isolation:** Puter KV is app-specific and normally scoped to the signed-in user. Two employees signing into different Puter accounts do **not** automatically see the same CMMS records. Browser UI is not an authorization boundary. This release does not provide role-based access control, change approval, or concurrent multi-user editing.

## 4. First-time configuration

Open **Settings & backup**. Enter the facility name (for example, *Coastal Resort & Casino*) and site code. Currency is ZAR. Click **Save settings**. The facility name appears in the navigation. Download a full backup after the master data is entered.

## 5. Recommended implementation sequence

1. Establish facility boundaries and unique naming conventions.
2. Enter the **Locations** hierarchy for hotel, casino, energy centre, water treatment, wastewater plant, commercial kitchens, conference centre, public areas, and accommodation village.
3. Enter **Teams**, including Electrical, Mechanical, HVAC, Building, Plumbing, Water Plant, and Contractors as appropriate.
4. Populate **Assets** with stable codes, criticality, locations, manufacturers, model numbers, serial numbers, and service notes.
5. Load **Inventory** opening balances and reorder thresholds.
6. Establish **PM plans** using approved procedures and competent-person assignments.
7. Review the **PM calendar** and issue the first scheduled work orders.
8. Use **Work orders** for breakdowns and maintenance activities; close them with findings, readings and costs.
9. Record statutory inspection status and certificate references in **Compliance**.
10. Review reports weekly and back up records regularly.

## 6. Dashboard

The Overview screen shows registered asset count, active work orders, overdue work, and active PM plans. Upcoming maintenance combines issued work orders and unissued PM occurrences for the next 30 days. Select **Issue** beside a planned occurrence to create its related work order. Workload priorities show the current backlog by Critical, High, Medium, and Low. Indicators alert you to stock quantities at/below reorder thresholds and overdue compliance entries.

**Definitions:** Open work = any order not Completed or Cancelled; overdue = an active order whose due date is before today; active PM plan = `active = true`.

## 7. Locations and facility hierarchy

Open **Locations** → **New record**. Assign a unique human-readable code, a location name, and optionally a parent location. Examples: `HOTEL`, `HOTEL-L3`, `KITCHEN-MAIN`, `ENERGY-CENTRE`, `WATER-PLANT`, and `CASINO`. Notes can identify access requirements, emergency contacts, or responsible departments. A location cannot be its own direct parent. Always establish hierarchy without cycles when editing parent references.

Do not delete locations while linked assets, orders, PM plans, readings, or inspections still reference them. Reassign linked records first.

## 8. Teams and personnel

Open **Teams**. Enter a person or team name, trade or discipline, email, and telephone. This register allows assignment by reference; **it does not send notifications** or manage user account permissions. For contractor tasks, document supplier identity and permit requirements in work instructions.

## 9. Asset register

Select **Asset register** → **New record**. Record an asset code, equipment name, location, category, criticality, operating status, manufacturer, model, serial number, installation date, and notes. A useful code pattern is `AREA-SYSTEM-NNN`, such as `EC-GEN-001` or `HOTEL-AHU-006`.

**Criticality:** Critical = potential life-safety, major compliance, prolonged outage or severe revenue consequences; High = major service disruption; Medium = manageable functional impairment; Low = minor or aesthetic. Adapt these categories through a formal risk assessment.

An equipment record can be linked to many PM plans, work orders, inspections and readings. Existing linked equipment cannot be deleted through the app until dependent records are removed/reassigned.

## 10. Corrective and emergency work orders

Open **Work orders** → **New record**. Enter the title, work type, asset and location, priority, status, assigned team, target date, fault description/instructions, labour hours, material cost, and completion findings. New orders receive a unique internal ID and a readable `WO-YYYY-XXXXX` reference. Select **Edit** to update an order and **Details** to review instructions and checklists.

**Work types:** Corrective, Preventive, Inspection, Emergency, Project. **Workflow statuses:** Open, Assigned, In Progress, On Hold, Completed, Cancelled. Use Emergency for urgent unplanned work; the app does not initiate emergency response or automatically notify a manager. Start external emergency procedures separately.

**Priority guidance:** Critical = attend immediately under local escalation SOP; High = urgent; Medium = normal; Low = planned. These labels do not create contractual response times in the system.

**Good practice:** Capture reported symptoms, isolation/permit reference, action taken, test results, reinstatement verification, and supervisor sign-off reference in the notes. Avoid personal or sensitive content unless strictly needed.

## 11. Preventive maintenance plans

Open **PM schedules** → **New PM plan**. Enter a title, linked asset, optional location, team, recurrence, interval, first due date, optional end date, priority, active toggle, instructions and checklist (one task per line).

Supported recurrence frequencies: Daily, Weekly, Monthly, Quarterly, Semi-annual, and Annual. The interval adds a multiplier: Monthly/2 is every 2 months, Weekly/2 is every 2 weeks. Invalid zero or negative intervals are rejected. Calendar occurrences are calculated from the **original start-date anchor**, so a plan beginning on January 31 uses each subsequent month's last available date without drifting to the 28th indefinitely. The plan's end date is inclusive.

**Scheduling note:** A recurring occurrence is a planning preview until the user clicks **Issue**. There is no server scheduler. If the browser stays closed for a week, the planned dates remain calculable when the app is next opened, but no jobs will have been automatically generated.

**Instructions and checklists:** Include only site-approved tasks. For electrical equipment, enter isolation, lockout/tagout, testing authority, required PPE, work permit and return-to-service provisions as appropriate. A checklist must be completed before a PM-generated order can be closed.

## 12. PM calendar and issuing work

Select **PM calendar**. Navigate months with arrows, or use **Today**. The Monday-first grid shows **blue** planned PM events and **green** issued work orders. Click a blue task to issue a linked work order. The issued order contains the PM title, asset, location, assignee, due date, priority, instructions and converted checklist. The application prevents duplicate creation for a given **plan and scheduled date**.

Click a green work order to view details and mark checklist items. Calendar display includes dates from surrounding weeks. For workload review and compliance, verify planned vs issued tasks periodically; only issued work orders count in work-order reports.

## 13. Execution, checklists, close-out

For an issued work order: select **Details**, read the instructions, complete the work under site safety procedures, tick completed checklist items, add **Completion notes**, and click **Mark completed**. The system blocks completion while checklist items remain unticked, and records a completion timestamp. The **Edit** dialog supports labour hours, material cost and other details, but is not a digital signature or independent authorization process.

The status and findings can be changed later by the account holder. For mandatory compliance or safety records, use controlled external document retention and signed certificates in addition to this app. The app's audit trail is a convenience activity log and not tamper-evident.

## 14. Compliance and statutory inspection records

Open **Compliance** → **New record**. Enter inspection/certificate title, linked asset, location, inspection date, next due date, result, reference number, inspector, and findings/corrective actions. A result of `Pass` is self-reported; the application does not independently validate the certificate or the inspector. Attachments are **not implemented** in version 1.0; store source certificates in approved controlled storage and record their reference numbers here.

Suggested register items, subject to legal applicability and site assessments: electrical inspection reports and CoCs; fire detection and suppression service reports; lift and escalator inspections; pressure equipment examinations; standby generation and changeover testing; HVAC/refrigerant service compliance; kitchen extraction and fire system maintenance; water quality testing; wastewater discharge testing; emergency lighting; and occupational health/safety plant inspections. Actual intervals must be sourced from current law, manufacturers and competent-person assessments, not inferred from sample PM plans.

## 15. Meter readings

Open **Meter readings**. Record an asset, date, parameter, numeric value, unit and comments. Examples: generator hours (`h`), electrical demand (`kW`), energy (`kWh`), tank level (`%`), pressure (`bar`), water flow (`m³`), or pump motor current (`A`). Readings are retained as time-stamped records and may be exported for external condition-based analysis. The current release does not implement threshold alarms or predictive maintenance.

## 16. Inventory and spares

Open **Inventory**. Capture part code, name, quantity on hand, reorder level, unit, unit cost, and supplier. The dashboard reports a low-stock condition when quantity is **less than or equal to** reorder level. Quantities are maintained manually; issuing a work order does not automatically deduct parts. Inventory does not include purchasing approvals or receiving transactions.

## 17. Reports and exports

**Reports** provides completed orders, completed PM orders, backlog, low-stock count, six-month completion trend, recorded materials cost and labour hours. Export a separate CSV file for any module via **Reports** or the individual module's **Export CSV** button. CSV fields preserve quotes, commas and line breaks. Spreadsheet tools may interpret cells containing spreadsheet formulas, so only import trusted exported datasets into a spreadsheet and consider neutralizing formula-leading text when handling untrusted entries.

Data remains account-scoped. The reports reflect the currently loaded dataset. If several people each maintain separate Puter accounts, these numbers cannot be assumed to represent the whole facility.

## 18. Audit trail and record preservation

The model stores recent user-driven create, edit, delete, issue, completion, checklist, restore, demo-load and settings events (up to the latest **2,000** events). The audit log is embedded in JSON backup rather than exposed as a separate UI screen. It is editable by someone with direct account/data access and therefore **not** a legally reliable immutable audit trail. To support formal document control, implement server-enforced identity, append-only logs, retention and sign-off before production safety reliance.

## 19. Backup, restore and demonstration data

**Create backup:** Settings & backup → **Download full backup** saves `cmms-backup-YYYY-MM-DD.json`. Protect it as operational data and store an encrypted copy in controlled company storage.

**Restore:** Settings & backup → **Restore JSON backup** → select file → confirm. Import checks the schema version and expected module-array structure; successful restore replaces all records in the active dataset. There is no automatic undo. Keep a pre-restore snapshot.

**Demo:** **Load demo dataset** replaces everything with sample hotel/casino/pumps/generator/UPS/HVAC assets, teams, PM plans, spare stock and work orders. Confirm only in a training environment or after exporting a complete backup. **Never treat demo records as actual maintenance evidence.**

## 20. Worked hospitality example

Create location `ENERGY` → *Energy Centre*. Create team *Electrical Team*. Add asset `ENERGY-GEN-001` → *Standby Generator 1*, category Generator, criticality Critical. Add PM plan *Weekly generator visual and functional inspection*, frequency Weekly, start date next Monday, assign Electrical Team, and add checklist items: check fuel system; inspect coolant and oil leaks; check battery charger; record run hours; test alarms under approved procedure; enter findings.

Open the calendar for the due week, click the blue PM item, and issue. After the authorized inspection, tick each checklist, document run hours in Meter readings and findings in the order, enter labour hours, then close. Review the completed work order in Reports. Where a statutory test is required, independently record the certificate and competent-person sign-off reference.

## 21. Suggested asset taxonomy and PM catalogue

This catalogue is **illustrative only**, not a substitute for a legally compliant PM schedule:

| Facility system | Representative assets | Typical maintenance review areas |
|---|---|---|
| Power and generation | Main LV boards, transformers, ATS, generators, UPS, batteries | Protection, indication, fuel, oil, cooling, batteries, transfer systems, authorized tests |
| Hotel guest areas | Room electrical systems, FCUs, pumps, lifts, lighting | Faults, comfort, energy, safety, service availability |
| Casino and IT | UPS, critical distribution, cooling, emergency systems | Resilience, redundancy, alarms, environmental conditions |
| Commercial kitchens | Extraction, refrigeration, cooking plant, DBs | Hygiene, heat, grease, refrigerants, electrical and fire hazards |
| Water treatment | Pumps, filters, dosing, tanks, level instruments | Water quality, leakage, pressure, hygiene, calibration |
| Wastewater plant | Blowers, pumps, aeration, dosing, monitoring | Discharge quality, motors, bearings, alarms, pumps |
| Conference facilities | AV, HVAC, lighting, distribution | Event readiness, emergency systems, comfort |
| Fire and life safety | Fire detection, extinguishing systems, emergency lighting | Approved inspection regimes, tests, certified service |
| Building fabric | Roofs, drainage, doors, glazing, access systems | Leakage, function, security, structural concerns |

## 22. Roles, privacy, security and operational controls

**Available authentication:** Puter sign-in to each individual's Puter storage. **Not available:** central operator/technician/admin roles, password policy administration, single organization tenant, signed approvals, remote collaboration, automatic event notifications, or reliable concurrent multi-user transactions. Publicly hosting the static app does not expose someone's Puter private data, but anyone can open the login interface and create their own isolated workspace. Do not publish live backup data, staff contact lists or building security details in a public Git repository.

The application uses `textContent`-equivalent HTML escaping for displayed values and injects no user-provided HTML as markup. API-side authorization is beyond this release. Follow applicable South African data protection requirements (including POPIA when personal data is processed), your employer's IT and document retention policies, and occupational safety law.

## 23. Deployment to a web host

### GitHub Pages

The app can be deployed to GitHub Pages, Cloudflare Pages, Netlify, Puter Hosting, or another HTTPS-capable static host. The repository structure is `cmms/`. Configure a build with working directory `cmms`, build command `npm ci && npm run build`, publish directory `cmms/dist`. For GitHub Pages hosted under `/cmss-hospitality-/`, this project uses relative asset paths and therefore works directly under repository subpaths.

### Local HTTP development

```bash
cd cmms
npm ci
npm run dev
# Browse to http://localhost:5173/.
```

### Production build

```bash
cd cmms
npm run check
npm run build
# Deploy the contents of dist/ to an HTTPS web server.
```

**Puter service:** No private API key is required in browser code. A Puter account is required for persistent cloud data. Avoid adding tokens to GitHub. Puter's user-pays pricing and quotas apply and may change; see official docs.

## 24. Installation and development

Prerequisites: Node.js 22+, npm, modern browser, git. No third-party npm packages are required. Development uses a Node.js static server, and the Puter.js CDN runtime handles authentication/storage. The main code lives in `src/core.js` (domain logic), `src/main.js` (UI and workflows), and `src/style.css` (responsive design). There is no backend service, email scheduler, or worker.

## 25. Quality assurance and acceptance checklist

Run `npm run check` once after installation. This executes pure Node.js unit tests and the dependency-free production build. Unit tests cover leap years/month-end recurrence, occurrence bounds, duplicate PM issuing, checklist closure, schema validation, CSV escaping, and demonstration data integrity. Manually verify the following representative browser path at least once in a **training dataset**: sign in → create location → create asset → create team → create PM plan → issue a due event → check all tasks → complete order → export CSV → download JSON backup → refresh after confirmed sync and verify saved records. Test backup restore only with disposable data; do not repeatedly restore or reload a production dataset.

CI executes the same test and build steps on GitHub changes under `cmms/` when GitHub Actions is configured.

## 26. Troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| Blank screen or failed imports | File opened directly or blocked scripts | Serve over HTTP/HTTPS; check browser console and `js.puter.com` access |
| Puter sign-in popup not appearing | Popup blocker or browser setting | Initiate via Connect Puter button; allow popup |
| Records disappear after refresh | Never signed in, or sync not completed | Connect Puter and click Sync now; restore local JSON if available |
| Different users have different data | Puter accounts have isolated stores | This is expected; a shared-worker backend is required for organizational data |
| No PM event in calendar | Plan inactive, start date out of range, or ended | Check start/end dates, active flag, interval and selected month |
| Same PM cannot be issued twice | Duplicate protection | Open the already issued green event |
| Work order cannot be closed | Unticked checklist item | Complete required checklist entries, then retry |
| Export is empty | Module has no records | Verify data and create entries |
| Very old daily plan shows partial calendar | Browser recurrence iteration limit | Archive/migrate old plans and create a new anchor; see code limit |
| Invalid JSON backup | Wrong schema or malformed file | Restore a file generated by this application with schemaVersion 1 |
| Cloud save error | Network outage, quota, auth timeout | Export a local backup, restore connectivity, then sync |

## 27. Business continuity and disaster recovery

A typical small-facility procedure: assign an owner for weekly JSON exports; save encrypted copies offsite according to company retention; keep a separate copy of signed statutory documents; test restoration periodically in a **separate training account**; and document ownership and recovery access. Since data is stored under one Puter account, losing that account or its access may affect records. For organization-wide resilient operation, migrate to a centrally owned multi-user backend with encrypted backups, authoritative roles, automated jobs and retention policies.

## 28. Data dictionary

| Collection | Purpose | Important fields |
|---|---|---|
| `locations` | Physical/functional hierarchy | `id, code, name, parentId, notes` |
| `people` | Assignee directory | `id, name, trade, email, phone` |
| `assets` | Equipment register | `id, code, name, locationId, category, criticality, status, manufacturer, model, serial` |
| `workOrders` | Corrective/PM work execution | `id, code, title, type, status, priority, assetId, locationId, assigneeId, dueDate, checklist, completionNotes, completedAt` |
| `plans` | Recurring PM definitions | `id, title, assetId, frequency, interval, startDate, endDate, active, instructions, checklist` |
| `parts` | Inventory balances | `id, code, name, quantity, reorderLevel, unit, unitCost, supplier` |
| `inspections` | Certificate/inspection index | `id, title, inspectionDate, nextDueDate, result, reference, inspector, findings` |
| `readings` | Meter and condition history | `id, assetId, readingDate, parameter, value, unit, notes` |
| `audit` | Latest 2,000 activity events | `id, at, action, collection, recordId, title` |
| `settings` | Facility identity | `facility, siteCode, currency` |

Records are JSON objects with randomly assigned IDs. Dates are ISO strings. `schemaVersion` is currently 1. CSV exports flatten nested objects as JSON text.

## 29. Current limitations and roadmap

This is a functional initial release, **not yet an enterprise production deployment**. Gaps for a subsequent enterprise release: server-owned centralized data; granular RBAC; organizational tenancy; atomic concurrent writes; work-order numbering sequence; server background PM generation; email/push reminders; job escalation; document/file attachments and controlled certificate storage; photographic evidence; purchase orders; stock issue/return transactions; permit-to-work and lockout workflows; supervisor e-signatures; immutable audits; signed inspection templates; SLA reporting; true offline sync; multi-site consolidation; and integrations with building management systems, IFS or other enterprise systems.

## 30. External documentation and legal considerations

- Puter.js: <https://docs.puter.com/llms.txt>
- Puter KV: <https://docs.puter.com/KV/>
- Puter Auth: <https://docs.puter.com/Auth/>
- Puter deployment: <https://docs.puter.com/deployments/>
- Puter Developer Portal: <https://developer.puter.com>

For South African facilities, verify current applicable requirements under the Occupational Health and Safety Act, Electrical Installation Regulations, Electrical Machinery Regulations, General Machinery Regulations, Construction Regulations where applicable, fire and environmental requirements, POPIA, and relevant adopted SANS standards. The existence of a CMMS record is not proof of technical conformity or regulatory compliance. Always use authorized competent persons and the facility's current policies.

---

**Document control:** Owner — Facility Engineering Management. Review the manual whenever the application changes. Record new revision dates and train affected users before introducing new workflows.

---

# Version 1.1 — MariaDB, technician accounts and document media

## 31. Operating modes

The original Puter.js single-account application remains available with `npm run dev` at `http://localhost:5173`. It does **not** use MariaDB and does **not** support shared technician login or media uploads.

The new **MariaDB shared-server mode** runs with `npm run server` and opens at `http://localhost:3001`. Use this address for all registered users. Do not operate the two modes simultaneously with the expectation that records will synchronize: they are **separate data stores**. The MariaDB server is a Node.js process; the browser never connects directly to port 3306.

## 32. Install MariaDB and configure database

Install MariaDB Server and Node.js 20+ on a trusted machine. In the MariaDB administration console, create a database and an application user (replace the example password):

```sql
CREATE DATABASE cmms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cmms_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_UNIQUE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER ON cmms.* TO 'cmms_app'@'localhost';
```

The server creates `cmms_users`, `cmms_state`, and `cmms_files` automatically on first connection. It does not create the database itself. Use a dedicated least-privilege account; never use MariaDB root for the application. If MariaDB is on a different machine, adjust the host in the SQL grant and `.env` to match your actual topology, firewall and TLS requirements.

From the `cmms` folder:

```bash
cp .env.example .env
chmod 600 .env
nano .env
npm install
npm run server
```

Edit `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CMMS_SETUP_TOKEN` and `CMMS_MEDIA_DIR` in `.env`. Generate the setup token with `openssl rand -hex 32`. Keep the `.env` file outside source control and never publish its contents. If the database is unavailable, the setup screen shows the connection problem without displaying credentials. A server restart is required after editing `.env`.

## 33. First administrator and technician registration

Open `http://localhost:3001`. When the database is connected but no accounts exist, the first-use page asks for the server setup token, an administrator username and a password of at least 12 characters. Once initialized, this bootstrap endpoint is closed.

Sign in as the administrator. Create individual technician records under **Teams** (People & Teams), then go to **Technicians** to register their usernames, passwords and linked person records. Choose the `technician` role for ordinary maintenance personnel. Their assigned work orders must reference the same person ID. The `admin` role has full management privileges. Do not share administrator accounts. Passwords are stored as salted scrypt hashes. The server uses HttpOnly, SameSite cookies and eight-hour in-memory sessions. Restarting the server logs everyone out. Administrators can create accounts; existing password reset is not included in this release.

## 34. Asset and compliance media

Open **Media library**, select **Assets** or **Compliance**, and choose the existing record. Upload a PDF, PNG, JPEG, WebP or TXT document (default maximum 15 MB). Documents are stored as opaque UUID filenames under `CMMS_MEDIA_DIR`, while original names and record relationships are stored in MariaDB. They are not served as public static files. A signed-in user can download; only administrators can upload and delete. Do not upload executables, confidential personal records, or files that have not been checked under your organization's information security policy. File type restrictions are based on declared MIME type, not antivirus or deep content scanning.

## 35. Technician performance reports

Open **Reports** and use the new Technician performance filters: **Technician**, **Date basis**, **From**, **To**. **Completed** filters by completion date and includes only completed orders; **Assigned / created** filters by the work-order creation date and includes both open and completed orders. The table groups matching work orders by assigned person, showing total orders, completed, open, preventive, corrective, labour hours and material costs. **Export filtered orders CSV** downloads the matching source records. Note that assigned date currently uses the work-order creation timestamp because a dedicated assignment-change history is not yet captured.

## 36. Backups, permissions and concurrency

Back up **both** MariaDB and `CMMS_MEDIA_DIR` at the same point in time. A JSON backup exported from Settings contains the CMMS record state, not uploaded file bytes or registered users. The shared database uses a version number; if another user has saved a newer revision, an outdated save is rejected rather than silently overwriting it. The user must reload and reconcile changes. Avoid multiple simultaneous browser tabs editing the same facility.

Technicians are server-restricted to progress fields on their own assigned work orders. Administrators manage records, schedules, users and uploads. All access to the API requires a login except system status and first-time bootstrap/login. This is a small-team shared application, not a fully normalized enterprise CMMS or a substitute for approved safety permits, statutory certificates or electronic signatures.

## 37. Production deployment and limitations

Keep MariaDB and the Node server on a trusted network. The default Node server binds to `127.0.0.1:3001` for local testing. For LAN deployment, configure `CMMS_BIND` appropriately, restrict access with firewall rules and place the server behind a properly configured HTTPS reverse proxy. Set `CMMS_HTTPS=true` only when HTTPS is actually in use. Never expose the unencrypted HTTP service to the public Internet. Configure monitoring, daily database/media backups, restore tests, and operating-system security updates.

The MariaDB driver `mysql2` must be installed using `npm install` when npm registry access is available. The codebase's automated unit tests cover the reporting filters and existing PM logic; **live MariaDB integration, file upload and multi-user browser flows must still be tested on your own server**. No automatic data migration from Puter KV to MariaDB is performed. Export the original Puter JSON backup and restore it through the MariaDB administrator session after checking that no existing shared records will be overwritten.

## 38. Individual technician assignment and filtered report exports

Open **People & teams** and create one named person record for each technician. Open **Work orders**, create or edit an order, and use **Assign to individual technician** to select the named person. The technician's registered login must be linked to the *same* person record in **Registered technicians**. This person ID is what determines the technician's work-order access and report attribution. Avoid selecting a generic shared team record when assigning individual work.

In **Reports → Technician performance**, select a technician (or all), the date basis (**Completed** or **Assigned / created**), and optional From/To dates. **CSV** exports the matching raw work orders. **Excel (.xml)** exports an Excel 2003 XML Spreadsheet, which Microsoft Excel and LibreOffice Calc can open and save as `.xlsx`; it is **not a native `.xlsx` file**. **Print / Save PDF** opens a formatted printable report in a new browser tab. Choose **Save to PDF** in the browser print dialog; allow pop-ups if prompted. All three exports use the currently selected technician and date filters. Reports are generated in the browser from the currently loaded CMMS state; they are not independently certified statutory records.


## 39. Technician directory and employee details

The **Technicians** page now presents registered accounts in a compact directory table with name, employee number, trade, email, cellphone, role and status. Use **Edit** beside a name to change username, role, linked employee or password (leave password blank to retain the current password). Use **Disable/Enable** to control access without deleting the record. Use **Employee details** to edit the linked person record; if the account has no linked person, choose **Add employee** and then link the account using **Edit**.

The **People & teams** employee profile contains full name, employee number, trade, work email, telephone, cellphone, date of birth, residential address, job title, department, employment start date and emergency contact information. Date of birth, address, employment date and emergency contact details are omitted from the API state delivered to technician-role accounts; administrators can manage them. These records contain personal information: grant administrator access sparingly, secure MariaDB backups, and establish retention and access procedures consistent with applicable privacy requirements. A technician's login is not the employee record: the two must be linked by the person's record ID to support assignment and reporting.
