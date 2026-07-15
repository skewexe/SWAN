
# 🦢 About SWAN

**SWAN** is a professional, open-source **GMAO** (*Gestion de Maintenance Assistée par Ordinateur* / Computerized Maintenance Management System - CMMS) SaaS platform. It is specifically tailored for the **Algerian industrial market**, with its interface, documentation, and business logic designed around French-language industrial maintenance workflows.

The project is actively developed and recently transitioned to a fully open-source model, removing legacy pricing information to focus on community deployment and accessibility.

---

## 🏗️ Architecture & Tech Stack

SWAN is built as a modern, type-safe **monorepo** designed for scalability and performance:

- **Package Manager**: `pnpm` workspaces
- **Runtime**: Node.js 24
- **Language**: TypeScript (~94.5%), JavaScript (~3.4%)
- **Frontend**: React + Vite
  - *UI/Styling*: `shadcn/ui`, `framer-motion`
  - *State & Forms*: `react-hook-form`, `zod` (v4)
  - *Routing*: `wouter`
  - *Data Visualization*: `recharts`
  - *Utilities*: `xlsx` (for batch imports/exports)
- **Backend**: Express 5 (compiled with `esbuild` for fast execution)
- **Database**: PostgreSQL
- **ORM & Validation**: Drizzle ORM + `drizzle-zod`
- **API Development**: OpenAPI specification with **Orval** for automatic TypeScript client code generation.

---

## ⚙️ Core Features

Based on the database schema and API routes, SWAN provides a complete suite of industrial maintenance tools:

1. **Asset Management (`/assets`)**  
   Track equipment with detailed metadata: name, category, serial number, location, status, criticality, MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair), and availability rates. Includes a machine parts catalog (`assetPartsTable`).

2. **Work Order Management (`/workorders`)**  
   Create, assign, and track maintenance tasks. Supports flexible assignment modes: by technician, by zone, by machine, or by task type.

3. **Preventive Maintenance (`/preventive`)**  
   Define recurring maintenance schedules. The system can automatically execute these plans, generating new work orders and updating future due dates.

4. **Inventory & Spare Parts (`/inventory`)**  
   Manage stock levels with automated low-stock alerts. When parts are consumed in a work order (`workOrderPartsTable`), inventory is automatically deducted.

5. **Reporting & KPIs (`/reports/kpis`)**  
   A dedicated dashboard providing real-time metrics on MTBF, MTTR, overall equipment availability, and a list of top-failing assets.

6. **Role-Based Access Control (RBAC)**  
   Granular permission system managed via `RBACContext.tsx`. Supported roles include:
   - `admin` (Full access)
   - `manager` (Oversight and reporting)
   - `chef_equipe` (Team lead / dispatch)
   - `technicien` (Filtered to see only assigned work orders)
   - `lecteur` (Read-only access)

---

## 🔌 Advanced Integrations

Recent commit history shows SWAN is expanding beyond a standalone CMMS into a connected industrial IoT hub:

- **SCADA Gateway**: Modules dedicated to interfacing with Supervisory Control and Data Acquisition systems, allowing real-time machine data to trigger maintenance workflows.
- **ERP Integration**: Dedicated pages and API endpoints for syncing data with external Enterprise Resource Planning systems.
- **Messaging Gateways**: Integrated **WhatsApp** and **Telegram** bots for automated work order creation, status updates, and technician notifications in the field.

---

## 🚀 Deployment & DevOps

The repository is designed for easy, one-click deployment across different environments:

- **Containerization**: Includes `Dockerfile.api`, `Dockerfile.scada`, and a unified `docker-compose.yml` for orchestrated local or production deployment.
- **Automated Setup**: 
  - `install.sh` (Linux/macOS) and `install.ps1` (Windows) for quick environment bootstrapping.
  - `scripts/setup.sh` and `scripts/post-merge.sh` to automate local database configuration and dependency syncing.
- **Reverse Proxy**: Pre-configured `nginx.conf` for production routing and SSL termination.

---

## 🤖 Development Origin

The repository lists **`replit-agent`** as a primary contributor. This indicates that the project was heavily scaffolded, bootstrapped, and iteratively developed using **Replit's AI coding agent**, leveraging AI to accelerate the creation of boilerplate, API specs, and UI components.

---

## 📌 Current Status

- **Visibility**: Public
- **License**: MIT (inferred from `package.json`)
- **Activity**: Highly active. Recent commits (as of July 2026) show active development on ERP integration, SCADA gateway updates, and open-source documentation.
- **Missing Elements**: The repository currently lacks a traditional `README.md` file in the root directory. Most of the architectural documentation is housed in `replit.md`.

---

### 💡 How to Get Started
If you want to run SWAN locally, the recommended path based on the repository structure is:
1. Ensure you have **Node.js 24**, **pnpm**, and **Docker** installed.
2. Clone the repository: `git clone https://github.com/skewexe/SWAN.git`
3. Run the automated setup script: `chmod +x install.sh && ./install.sh`
4. Alternatively, use Docker: `docker-compose up -d`

*Note: You will need to configure a PostgreSQL database connection string in your environment variables before starting the API server.*
