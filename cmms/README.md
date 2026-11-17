# CMMS — Hospitality Facility Management

Modern responsive facility maintenance application using **Puter.js** for user-account cloud storage and a no-backend static frontend.

## Modules

- Dashboard: backlog, overdue jobs, maintenance pipeline and stock alerts.
- Assets, locations and personnel: equipment register and service directory.
- Work orders: corrective, preventive and emergency maintenance with priority, assignment, costs, checklists and close-out.
- PM planner and visual calendar: daily/weekly/monthly/quarterly/semi-annual/annual recurrence with anchored month-end arithmetic and duplicate-protected issuing.
- Compliance register, meter readings and stock inventory.
- Analytics, module CSV export, JSON backup and restore, activity history.

## Start

```bash
npm ci
npm run dev
```

Open http://localhost:5173/. **Do not** open `index.html` directly from disk. Click **Connect Puter** to persist records. Without sign-in, data is temporary.

## Verify and build

```bash
npm run check
npm run build
```

Deploy `dist/` to a static HTTPS host. Includes `USER_MANUAL.md` accessible at the site root. Relative URLs support GitHub Pages repository subpaths. No npm dependencies are required.

## Storage and security

Puter KV storage is **per signed-in user**; this is a **single-account CMMS**, not centralized multi-user administration or a certified safety management platform. It has no backend-scheduled job issuing, permission-enforced roles, immutable audit logging, file attachments or email alerts. For production-wide maintenance operations, an organization-owned server-side database, access controls and change/audit governance are required. Export backups routinely.

See [USER_MANUAL.md](USER_MANUAL.md) for full operating procedures, deployment, limitations and troubleshooting.

Powered by [Puter](https://developer.puter.com).