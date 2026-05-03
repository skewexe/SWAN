# SWAN GMAO — Workspace

## Overview

SWAN is a professional GMAO (Computerized Maintenance Management System) SaaS platform in French for the Algerian industrial market. pnpm workspace monorepo with React+Vite frontend and Express backend.

## Design System

- **Theme**: Dark — Deep Core Blue background (`#0B132B`), Swan Blue accent (`#0A6DFF`)
- **Font**: Inter
- **UI Library**: shadcn/ui + Tailwind CSS + framer-motion

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, framer-motion, recharts, react-hook-form, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API server)

## Artifacts

- `artifacts/swan-gmao` — React+Vite web app (frontend), preview path `/`
- `artifacts/api-server` — Express API server, path `/api`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Routes (all under `/api`)

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Health check |
| GET | `/dashboard/stats` | KPI dashboard cards |
| GET | `/dashboard/activity` | Recent activity feed |
| GET | `/dashboard/chart-data` | Chart data |
| GET/POST | `/assets` | Equipment list & create |
| PUT/DELETE | `/assets/:id` | Update/delete equipment |
| GET/POST | `/workorders` | Work orders list & create |
| GET/PUT/DELETE | `/workorders/:id` | Work order detail |
| GET/POST | `/workorders/:id/parts` | Parts for a work order (deducts stock) |
| DELETE | `/workorders/:id/parts/:partId` | Remove part from WO (restores stock) |
| GET/POST | `/preventive` | Preventive plans list & create |
| PUT/DELETE | `/preventive/:id` | Update/delete plan |
| POST | `/preventive/:id/execute` | Execute plan → creates WO + updates dates |
| GET/POST | `/inventory` | Inventory list & create |
| PUT/DELETE | `/inventory/:id` | Update/delete inventory item |
| GET/POST | `/technicians` | Technicians list & create |
| PUT/DELETE | `/technicians/:id` | Update/delete technician |
| GET | `/reports/kpis` | MTBF, MTTR, availability, top failing assets |
| GET | `/reports/costs` | Labor/parts/downtime costs by month |
| GET | `/notifications` | Live notifications from DB state |
| PUT | `/notifications/:id/read` | Mark notification read |
| PUT | `/notifications/read-all` | Mark all notifications read |

## Important Notes

- **API server uses esbuild** — do NOT import zod directly in routes; use plain JS validation instead (zod is fine in lib/api-zod)
- **Generated hooks** live in `lib/api-client-react/src/generated/api.ts` — import from `@workspace/api-client-react`
- **Route paths on server**: without `/api` prefix (e.g. `/workorders`, not `/api/workorders`)
- **Logo asset**: `attached_assets/ChatGPT Image 30 avr. 2026, 11_42_07.png` — used across all surfaces

## Pages

| Route | Component | Description |
|---|---|---|
| `/` | LandingPage | Public landing with hero, features, pricing, CTA |
| `/login` | LoginPage | Login form |
| `/register` | RegisterPage | Registration form |
| `/about` | AboutPage | Mission & values |
| `/faq` | FAQPage | Accordion FAQ |
| `/dashboard` | DashboardPage | KPI cards, charts, activity feed |
| `/assets` | AssetsPage | Equipment management (CRUD) |
| `/workorders` | WorkOrdersPage | Work orders + parts management (stock deduction) |
| `/preventive` | PreventivePage | Preventive plans + Execute button |
| `/inventory` | InventoryPage | Stock management (CRUD) |
| `/technicians` | TechniciansPage | Personnel cards (CRUD) |
| `/reports` | ReportsPage | KPIs + cost charts |

## Shared Components

- `DashboardLayout` — sidebar nav, notification bell header
- `PublicLayout` — public nav/footer
- `NotificationsDropdown` — real-time bell with polling, dismiss support
- `WorkOrderDetailSheet` — right-side panel: status progression, parts list, WO details (opens on row click or detail button)
- `AssetDetailSheet` — right-side panel: KPI pills (availability/MTBF/MTTR), asset info, WO history via `GET /api/assets/:id/workorders`

## Dashboard Sections

- 8 KPI cards (totals, availability, MTBF, MTTR, stock alert, planned maintenance)
- Bar chart: interventions by month (corrective vs preventive)
- Pie chart: assets by category
- **Agenda de la semaine**: upcoming WOs in next 7 days with priority dot + status badge
- **Plans en retard**: overdue preventive plans with due date
- Activity feed: recent platform events

## Backend Notes

- `PUT /workorders/:id` uses `.partial()` Zod validation — allows partial status-only updates
- `GET /assets/:id/workorders` — returns WOs filtered by asset, enriched with technicianName

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
