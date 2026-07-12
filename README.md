Contributor: sushmithashreep4

# AssetFlow — Enterprise Asset & Resource Management System

A hackathon-ready ERP module for tracking, allocating, and maintaining physical assets and shared resources.

## Stack
- **Backend:** Node.js + Express, JWT auth, bcrypt password hashing, JSON-file persistence (`backend/data/db.json` — auto-created and seeded on first run, no DB install needed)
- **Frontend:** React + Vite, React Router, plain CSS (navy/teal SaaS theme, no UI framework dependency)

## Quick Start

Open two terminals.

**Terminal 1 — backend**
```
cd backend
npm install
npm start
```
Runs on http://localhost:5000. Seeds demo data (departments, categories, employees, assets, allocations, bookings, maintenance requests) into `backend/data/db.json` on first run.

**Terminal 2 — frontend**
```
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 and proxies `/api` calls to the backend.

## Demo Logins (seeded)
| Role | Email | Password |
|---|---|---|
| Admin | admin@assetflow.com | admin123 |
| Asset Manager | rohan@assetflow.com | rohan123 |
| Department Head | sana@assetflow.com | sana123 |
| Employee | priya@assetflow.com | priya123 |

You can also sign up a new account from the login screen — signup always creates a plain **Employee** account; only an Admin can promote someone to Department Head / Asset Manager via Organization Setup → Employees.

## Core business rules implemented (the parts judges will poke at)
1. **Double-allocation block** — allocating an asset that's already actively held returns a 409 with the current holder's name and a "Request Transfer" path instead. Try allocating `AF-0114` (already held by Priya Shah) to see it fire.
2. **Booking overlap validation** — booking Conference Room B2 for a time that overlaps an existing booking (seeded: 09:00–10:00) is rejected with the conflicting booking's details; a back-to-back slot (10:00–11:00) succeeds.
3. **Maintenance approval workflow** — Kanban: Pending → Approved (asset flips to *Under Maintenance*) → Resolved (asset flips back to *Available*), or Rejected.
4. **Audit cycles** — scoped to a department, auto-pulls matching assets into a checklist, auditors mark Verified/Missing/Damaged/Mismatch, closing the cycle auto-generates a discrepancy report and sets confirmed-missing assets to *Lost*.
5. **Role-based access** — Organization Setup is Admin-only; transfer/maintenance approvals require Admin/Asset Manager/Department Head.
6. **Notifications & activity log** — every allocation, transfer, booking, maintenance transition, and audit closure writes to both feeds, visible on Screen 10 and summarized on the Dashboard.

## What's intentionally minimal (24h time budget)
- No file/photo upload for assets or maintenance requests (fields exist in the data model, no upload UI).
- Reports page uses computed aggregates + simple progress bars instead of a charting library — swap in Chart.js/Recharts if you have time left.
- Auth is JWT + bcrypt but has no password-reset email flow ("Forgot password" is a placeholder link).
- Booking calendar shows one resource/one day at a time rather than a full multi-resource week view.

## Project structure
```
backend/
  server.js          entry point, mounts all routes
  db.js              JSON-file persistence + seed data
  routes/            auth, org, assets, allocations, bookings, maintenance, audits, reports, notifications
  middleware/auth.js  JWT verification + role guard
frontend/
  src/pages/          one file per screen (Login, Dashboard, OrgSetup, Assets, Allocation, Booking, Maintenance, Audit, Reports, Notifications)
  src/components/     Layout (sidebar+topbar), Modal, Badge
  src/AuthContext.jsx  login/signup/logout state
  src/api.js          fetch wrapper that attaches the JWT
```
