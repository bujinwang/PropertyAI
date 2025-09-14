# Unified Project Structure - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Document the current project directory structure, file organization patterns, and extensions for new features like reporting (21.4). Structure follows Node.js/Express backend and React frontend separation.

## Project Root Structure

```
PropertyAI/ (Root)
├── .bmad-core/          # BMAD method configuration and templates
├── backend/             # Node.js/Express server
├── dashboard/           # React/TypeScript frontend
├── docs/                # Documentation (PRD, architecture, stories)
├── infrastructure/      # Terraform IaC for GCP
├── mobile/              # React Native mobile app
├── propertyapp/         # Alternative mobile app (legacy/experimental)
├── scripts/             # Utility scripts and seeders
├── src/                 # Core source code (shared backend)
├── tests/               # Jest test files
├── .env.example         # Environment configuration
├── package.json         # Dependencies and scripts
└── README.md           # Project overview
```

## Backend Structure (`backend/` and `src/`)

**Configuration:**
- `src/config/` - Database, email, external API configs
  - database.js - Sequelize/PostgreSQL setup
  - email.js - Email service config (Nodemailer/SendGrid)

**Models (`src/models/`):**
- Sequelize models with migrations in `src/models/migrations/`
- Seeders in `src/models/seed-*.js`
- Extensions: Add new models like ReportTemplate.js in same directory

**Services (`src/services/`):**
- Business logic services (single responsibility)
- Each service handles one domain (e.g., analyticsService.js, reportingService.js for 21.4)
- Use async/await, error handling, and logging

**Routes (`src/routes/`):**
- Express route files by domain (e.g., analytics.js, reports.js for 21.4)
- All routes use `/api/v1` prefix
- Auth middleware applied per route

**Middleware (`src/middleware/`):**
- authMiddleware.js - JWT validation
- validationMiddleware.js - Joi schema validation
- errorHandler.js - Global error handling

**Utilities (`src/utils/`):**
- Helper functions, constants
- Avoid business logic here

**Extensions for Reporting (21.4):**
- New: `src/services/reportingService.js` - AI report generation
- New: `src/routes/reports.js` - Report endpoints
- Extend: `src/services/analyticsService.js` - Add report aggregation methods
- Migrations: Add ReportTemplate and GeneratedReport in `src/models/migrations/`

## Frontend Structure (`dashboard/`)

**Services (`dashboard/src/services/`):**
- API wrappers with TypeScript interfaces (e.g., reportingService.ts for 21.4)
- State management hooks for data fetching

**Components (`dashboard/src/components/`):**
- Atomic design: atoms/ (Button, Input), molecules/ (FormField), organisms/ (PropertyCard), templates/ (DashboardLayout), pages/ (PropertyDetail)
- New for 21.4: organisms/ReportDashboard.tsx, molecules/ReportScheduler.tsx

**Pages (`dashboard/src/pages/`):**
- Role-based pages (e.g., PropertyDetail.tsx with tabs)
- Extensions: Add report actions to existing pages like PropertyDetail

**Hooks (`dashboard/src/hooks/`):**
- Custom hooks for auth, data loading, form validation

**Assets (`dashboard/src/assets/`):**
- Images, icons, static files

**Extensions for Reporting (21.4):**
- New: services/reportingService.ts - Frontend API calls for reports
- New: components/ReportDashboard.tsx - Main reporting UI
- Extend: pages/Analytics.tsx - Add report generation section
- New: components/InsightGenerator.tsx - AI content display

## Testing Structure (`tests/`)

- Unit: `tests/*.test.js` for services (Jest)
- Integration: `tests/*Routes.test.js` for endpoints (Supertest)
- Component: `dashboard/src/components/**/*.test.tsx` for React (React Testing Library)
- E2E: `tests/e2e/` (planned for Cypress)

**Extensions for Reporting (21.4):**
- New: tests/reportingService.test.js - Unit tests for report generation
- New: tests/reportsRoutes.test.js - Integration tests for new endpoints
- Extend: tests/analyticsRoutes.test.js - Add report-related tests

## Infrastructure (`infrastructure/`)

- Terraform modules for GCP resources (GKE, SQL, Redis, etc.)
- Environments: dev/, prod/ with tfvars
- Extensions: No immediate changes for 21.4, but consider Pub/Sub for report notifications

## Scripts and Utilities (`scripts/`)

- Seeders: `scripts/mongodb-seed/seed.js` for test data
- Migrations: Run via Sequelize CLI
- Extensions for Reporting: Add `scripts/generate-sample-reports.js` for testing

## File Naming Conventions

- Backend: kebab-case.js (e.g., market-data-service.js)
- Frontend: PascalCase.tsx (e.g., ReportDashboard.tsx)
- Models: PascalCase.js (e.g., ReportTemplate.js)
- Migrations: YYYYMMDD-description.js (e.g., 20250914-create-report-template.js)
- Tests: [target].test.js (e.g., reportingService.test.js)

## Module Organization for New Features (21.4 Reporting)

**Backend Module (`src/reports/`):**
- services/reportingService.js - Core logic
- routes/reports.js - Endpoints
- models/ReportTemplate.js - Template model
- models/GeneratedReport.js - Generated report model
- utils/reportHelpers.js - Formatting and export utils

**Frontend Module (`dashboard/src/reports/`):**
- services/reportingService.ts - API integration
- components/ReportDashboard.tsx - Main UI
- components/ReportPreview.tsx - Preview molecule
- components/InsightGenerator.tsx - AI insights organism
- hooks/useReportGeneration.ts - Custom hook for async operations

**Database Extensions:**
- Migrations in `src/models/migrations/` for new tables
- Seeders in `scripts/` for report test data

**Testing Extensions:**
- Unit tests in `tests/` for new services
- Component tests in `dashboard/src/components/**/*.test.tsx`
- Integration tests in `tests/reportsRoutes.test.js`

## Constraints and Patterns

- **Monorepo:** All frontend/backend in root; no separate repos.
- **Shared Types:** Use shared interfaces where possible (e.g., Property type across services).
- **Environment-Specific:** Use .env for dev/prod configs.
- **Build Process:** npm run build for both backend and dashboard.
- **Dependencies:** Centralized in package.json; no peer deps.

**Note:** This brownfield structure documentation reflects current organization. New reporting module (21.4) fits within existing patterns: new service/route files, frontend components, models/migrations as needed.