# SWAN GMAO — Workspace

## Overview

SWAN is a professional GMAO (Computerized Maintenance Management System) SaaS platform in French for the Algerian industrial market. pnpm workspace monorepo with React+Vite frontend and Express backend.

## Design System

- **Theme**: Dark — Deep Core Blue background (`#0B132B`), Swan Blue accent (`#0A6DFF`)
- **Font**: Inter
- **UI Library**: shadcn/ui + Tailwind CSS + framer-motion

### Premium Design Tokens (applied globally across all pages)
- **Section label**: `text-[11px] font-semibold uppercase tracking-[0.22em] text-primary` — appears above every page `<h1>`
- **Page heading**: `text-2xl font-semibold tracking-tight text-foreground`
- **Primary action buttons**: `rounded-full`
- **Table / list containers**: `rounded-3xl`
- **Card components (technician cards, KPI cards)**: `rounded-3xl` (main) / `rounded-2xl` (small stat cards)
- **Settings sidebar tabs**: `rounded-2xl` with `bg-primary/10 text-primary` active state
- **Auth form cards (Login, Register)**: `rounded-3xl border-border/60 shadow-xl`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, framer-motion, recharts, react-hook-form, shadcn/ui, xlsx)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API server)

## Artifacts

- `artifacts/swan-gmao` — React+Vite web app (frontend), preview path `/`
- `artifacts/api-server` — Express API server, paths `/api` AND `/whatsapp` (proxies to gateway)
- `artifacts/whatsapp-gateway` — Standalone Node.js CJS service (Express + whatsapp-web.js), port 8099, workflow: "artifacts/whatsapp-gateway: WhatsApp Gateway" (autoStart: false — start manually)

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
| GET/PUT/DELETE | `/assets/:id` | Get/update/delete equipment |
| GET | `/assets/:id/workorders` | WOs for a given asset |
| GET/POST | `/assets/:id/parts` | Machine parts catalog (pièces machine) |
| PUT/DELETE | `/assets/:id/parts/:partId` | Update/delete machine part |
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
| GET/POST | `/sites` | Multi-site list & create |
| PUT/DELETE | `/sites/:id` | Update/delete site |
| GET/POST | `/zones` | Zone list & create (filterable by siteId) |
| PUT/DELETE | `/zones/:id` | Update/delete zone |

## Database Schema (key tables)

- `assetsTable` — name, category, serialNumber, location, status, criticality, siteId, zoneId, photoUrl, mtbf, mttr, availabilityRate
- `workOrdersTable` — title, type, priority, status, assetId, technicianId, siteId, zoneId, assignmentMode (by_technician/by_zone/by_machine/by_type)
- `sitesTable` — name, location, city, country
- `zonesTable` — name, siteId, description
- `assetPartsTable` — assetId, inventoryItemId, partName, reference, quantity, unit, note (machine parts catalog)
- `inventoryItemsTable` — stock management with low-stock alerts
- `workOrderPartsTable` — parts consumed in a WO (deducts from inventory)
- `techniciansTable` — tech personnel with skills, specialization, status
- `preventivePlansTable` — recurring maintenance schedules

## Important Notes

- **API server uses esbuild** — do NOT import zod/v4 directly in routes; use plain JS validation instead (zod is fine in lib/api-zod)
- **Generated hooks** live in `lib/api-client-react/src/generated/api.ts` — import from `@workspace/api-client-react`
- **Generated Zod schemas** live in `lib/api-zod/src/generated/api.ts` — import from `@workspace/api-zod`
- **Route paths on server**: without `/api` prefix (e.g. `/workorders`, not `/api/workorders`)
- **Logo asset**: `attached_assets/ChatGPT Image 30 avr. 2026, 11_42_07.png` — used across all surfaces
- **RBAC context**: `artifacts/swan-gmao/src/context/RBACContext.tsx` — wraps entire app via `RBACProvider` in App.tsx
- **After schema changes**: run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/api-spec run codegen`

## Pages

| Route | Component | Description |
|---|---|---|
| `/` | LandingPage | Public landing with hero, features, pricing, CTA |
| `/login` | LoginPage | Login form (demo vs live mode split) |
| `/register` | RegisterPage | Registration form |
| `/about` | AboutPage | Mission & values |
| `/faq` | FAQPage | Accordion FAQ |
| `/dashboard` | DashboardPage | KPI cards, cross-filter charts, activity feed |
| `/assets` | AssetsPage | Equipment: CRUD + bulk-types + CSV/Excel import + site/zone/photo + machine parts catalog |
| `/workorders` | WorkOrdersPage | Work orders + parts + site/zone/assignmentMode (RBAC: techniciens see only assigned OTs) |
| `/preventive` | PreventivePage | Preventive plans + Execute button |
| `/calendar` | CalendarPage | Month/week calendar: WOs + preventive plans |
| `/inventory` | InventoryPage | Stock management (CRUD) |
| `/technicians` | TechniciansPage | Personnel cards (CRUD) |
| `/reports` | ReportsPage | KPIs + cost charts |
| `/settings` | SettingsPage | Profile, Équipes RBAC, Notifications, Preferences |
| `/whatsapp-admin` | WhatsAppPage | WhatsApp Gateway admin — QR code, numéros autorisés, send, journaux (admin only) |

## RBAC System

`RBACContext.tsx` provides:
- **Roles**: `admin` | `manager` | `chef_equipe` | `technicien` | `lecteur`
- `visibleNav` — filtered nav items per role
- `can(key)` — check permission by module key
- `isReadOnly` — true for `lecteur` role
- Teams managed in Settings → Équipes & Rôles tab
- Technician role: work orders filtered to `technicianId` only
- Role change in Settings → Profil applies live to entire app

## Assets — All Features

- **CRUD**: create, edit, delete with full form (name, category, serial, location, manufacturer, model, install date, status, criticality)
- **Site & Zone**: assign each asset to a site and zone (dropdowns filtered by site)
- **Photo**: upload or URL-based photo, with preview thumbnail in form and full view in detail sheet
- **"Création par types"**: multi-type batch dialog — define N types (prefix, count, category, location, etc.), creates all in one operation with progress bar
- **"Import CSV / Excel"**: supports `.csv`, `.xlsx`, `.xls` files; drag-and-drop; column auto-mapping; preview table; downloadable template
- **Machine Parts Catalog**: per-asset parts list (AssetPartsDialog in detail sheet) — add/remove parts linked to inventory items

## Work Orders — All Features

- **CRUD**: create, edit, delete, view detail
- **Assignment modes**: by_technician / by_zone / by_machine / by_type
- **Site & Zone**: link each WO to a site and zone (zone dropdown filters by selected site)
- **Parts management**: add/remove inventory items consumed (auto-deducts/restores stock)
- **Status progression**: interactive flow (open → in_progress → completed → on_hold → cancelled)
- **RBAC**: technicians see only their assigned OTs

## Shared Components

- `DashboardLayout` — sidebar nav (RBAC-filtered), user role badge, notification bell header
- `PublicLayout` — public nav/footer
- `RBACProvider` / `useRBAC` — global role/team/permission context
- `NotificationsDropdown` — real-time bell with polling, dismiss support
- `WorkOrderDetailSheet` — right-side panel: status progression, parts list, WO details (incl. site/zone/assignmentMode)
- `AssetDetailSheet` — right-side panel: photo, KPI pills, asset info (incl. site/zone), machine parts catalog, WO history

## Dashboard Sections

- 8 KPI cards (totals, availability, MTBF, MTTR, stock alert, planned maintenance)
- Bar chart: interventions by month (corrective vs preventive) — clickable to filter by month
- Pie chart: assets by category — clickable to filter by category
- **WO Status Distribution**: horizontal bars — clickable to filter by status (cross-filter: driven by priority+month)
- **WO Priority Distribution**: horizontal bars — clickable to filter by priority (cross-filter: driven by status+month)
- **Availability Trend AreaChart**: estimated availability % vs 95% target over last 6 months
- **Agenda de la semaine**: upcoming WOs in next 7 days
- **Plans en retard**: overdue preventive plans
- Activity feed + cross-filter chips with reset button

## Reports Page Sections

- 5 KPI metrics with trend indicators (MTBF, MTTR, Disponibilité, OT Complétés, Préventif/Correctif)
- **MTBF / MTTR Trend AreaChart**: 6-month trend with gradient fills
- **Availability Trend AreaChart**: vs 95% target objective line
- Top failing assets (animated horizontal bars)
- Cost breakdown bar chart (labor / parts / downtime by month)
- Cost totals row (4 cards)

## Backend Notes

- `PUT /workorders/:id` uses `.partial()` Zod validation — allows partial status-only updates
- `GET /assets/:id/workorders` — returns WOs filtered by asset, enriched with technicianName, siteName, zoneName
- Routes for sites/zones/asset_parts use plain JS validation (not Zod) to avoid esbuild bundling issues
- **OpenAPI spec field names must match DB column names exactly**: `PreventivePlan` uses `name`/`nextDue`/`estimatedDuration`/`lastExecuted` (not `title`/`nextDueDate`/`estimatedHours`). `InventoryItem` includes computed `totalValue` field. After any spec change, run `pnpm --filter @workspace/api-spec run codegen`.
- `POST /sites` and `POST /zones` use `{ res.status(400).json(...); return; }` pattern (not `return res.json(...)`) to satisfy TS7030.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
