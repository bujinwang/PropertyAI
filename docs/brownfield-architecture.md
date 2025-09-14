# PropertyAI Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the PropertyAI codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements, particularly the Business Intelligence Dashboard (Story 17.2).

### Document Scope

Focused on areas relevant to Epic 17: Advanced Analytics & Business Intelligence, including:
- Predictive Analytics Engine (Story 17.1)
- Business Intelligence Dashboard (Story 17.2)
- Integration with existing system modules

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-01-12 | 1.0     | Initial brownfield analysis | BMad Master |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Backend Entry**: `backend/src/index.ts` (Express server with Socket.io)
- **Frontend Entry**: `dashboard/src/main.tsx` (React with Material-UI)
- **Database Schema**: `backend/prisma/schema.prisma` (PostgreSQL with Prisma)
- **Core Business Logic**: `backend/src/` (TypeScript modules)
- **Frontend Components**: `dashboard/src/components/` (React components)
- **API Routes**: `backend/src/routes/` (REST API endpoints)

### Story 17.2 Enhancement Impact Areas

Files that will need modification for the BI Dashboard:
- `dashboard/src/pages/Dashboard.tsx` - Main dashboard container
- `backend/src/routes/analytics.ts` - New analytics API endpoints
- `backend/prisma/schema.prisma` - Potential new analytics models
- `dashboard/src/components/` - New chart and widget components

## High Level Architecture

### Technical Summary

PropertyAI is a comprehensive property management platform built with:
- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL
- **Frontend**: React 18 + TypeScript + Material-UI + Vite
- **Real-time**: Socket.io for live updates
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker + Kubernetes (infrastructure/)
- **AI/ML**: Python scripts for predictive analytics
- **IoT**: MQTT/Zigbee integration for smart devices
- **Security**: Multi-factor authentication, SSO, biometric auth

### Actual Tech Stack (from package.json analysis)

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | >=20.0.0 | TypeScript compilation     |
| Framework | Express    | 4.18.2  | REST API with middleware   |
| Database  | PostgreSQL | Latest  | Prisma ORM                 |
| Frontend  | React      | 18.2.0  | Material-UI v7             |
| Build     | Vite       | 7.0.4   | Fast HMR development       |
| Real-time | Socket.io  | 4.8.1   | WebSocket integration      |
| Charts    | Chart.js   | 4.4.3   | Data visualization         |
| Payments  | Stripe     | 18.2.1  | Payment processing         |
| AI/ML     | Python     | 3.x     | Predictive analytics       |

### Repository Structure Reality Check

- Type: Monorepo with workspaces (backend, dashboard, ContractorApp, propertyapp)
- Package Manager: npm with workspaces
- Build System: TypeScript compilation + Vite for frontend
- Testing: Jest across all workspaces
- Notable: Python scripts integrated into Node.js dev workflow

## Source Tree and Module Organization

### Project Structure (Actual)

```
PropertyAI/
├── backend/                          # Node.js backend
│   ├── src/
│   │   ├── index.ts                  # Main server entry
│   │   ├── routes/                   # API route handlers
│   │   ├── services/                 # Business logic services
│   │   ├── models/                   # Data models (Prisma)
│   │   ├── middleware/               # Express middleware
│   │   ├── utils/                    # Utility functions
│   │   ├── predictive-analytics/     # Python ML scripts
│   │   └── prisma/
│   │       ├── schema.prisma         # Database schema
│   │       └── seed.ts              # Database seeding
│   ├── tests/                        # Backend tests
│   └── package.json
├── dashboard/                        # React frontend
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API client services
│   │   ├── utils/                    # Frontend utilities
│   │   └── styles/                   # CSS and themes
│   ├── public/                       # Static assets
│   └── package.json
├── ContractorApp/                    # Mobile contractor app
├── propertyapp/                      # Mobile tenant app
├── infrastructure/                   # Terraform configs
└── docs/                            # Documentation
```

### Key Modules and Their Purpose

- **User Management**: `backend/src/services/userService.ts` - Authentication, profiles, roles
- **Property Management**: `backend/src/routes/rentals.ts` - CRUD for properties/units
- **Maintenance Tracking**: `backend/src/routes/maintenance.ts` - Work orders, vendors
- **Financial Management**: `backend/src/routes/transactions.ts` - Payments, invoices
- **IoT Integration**: `backend/src/routes/iot.ts` - Smart device management
- **Analytics Engine**: `backend/src/services/analyticsService.ts` - Data processing
- **Dashboard Frontend**: `dashboard/src/pages/Dashboard.tsx` - Main UI container
- **Predictive Analytics**: `backend/src/predictive-analytics/` - Python ML models

## Data Models and APIs

### Data Models

The system uses Prisma ORM with PostgreSQL. Key models include:

- **User**: Authentication, roles, profiles (with MFA, biometric, SSO support)
- **Rental**: Properties, units, amenities, pricing
- **MaintenanceRequest**: Work orders, priorities, status tracking
- **Transaction**: Financial records, payments, approvals
- **IoTDevice**: Smart devices, sensors, protocols
- **WorkflowDefinition**: Automated business processes
- **AnalyticsRule**: IoT sensor monitoring rules

### API Specifications

**Current API Structure:**
- RESTful endpoints in `backend/src/routes/`
- Socket.io for real-time updates
- Authentication via JWT with refresh tokens
- Rate limiting and security middleware
- File upload support (AWS S3, images/documents)

**Key Endpoints for Story 17.2:**
- `GET /api/analytics/dashboard/:userId` - Dashboard configuration
- `GET /api/analytics/widgets/:type` - Widget data
- `POST /api/analytics/reports/generate` - Report generation
- `GET /api/rentals/:id/analytics` - Property-specific analytics

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Python Integration**: Python scripts are called from Node.js dev script but not properly containerized
2. **Database Migrations**: Complex schema with many interdependencies, migration testing needed
3. **IoT Device Management**: Multiple protocols (MQTT, Zigbee, Z-Wave) with inconsistent error handling
4. **Real-time Updates**: Socket.io implementation may have memory leaks under high load
5. **File Storage**: Mixed AWS S3 and local storage, inconsistent CDN usage

### Workarounds and Gotchas

- **Environment Variables**: Must set `NODE_ENV=production` even for staging (historical artifact)
- **Database Connections**: Connection pool hardcoded, may need adjustment for high load
- **Python Dependencies**: ML scripts require specific Python environment setup
- **Mobile Apps**: Separate apps for contractors and tenants, limited code sharing
- **Testing**: Integration tests require full database setup, slow execution

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Stripe   | Payments | REST API + Webhooks | `backend/src/services/stripe.ts` |
| AWS S3   | File Storage | SDK | `backend/src/services/s3Service.ts` |
| SendGrid | Email | SDK | `backend/src/services/emailService.ts` |
| Twilio   | SMS | SDK | `backend/src/services/smsService.ts` |
| Google Maps | Geocoding | API | `backend/src/services/mapsService.ts` |
| Plaid    | Bank Integration | API | `backend/src/services/plaidService.ts` |

### Internal Integration Points

- **Frontend-Backend**: REST API on port 3001, JWT auth
- **Real-time Updates**: Socket.io for live dashboard updates
- **File Processing**: Background jobs via BullMQ + Redis
- **IoT Data**: MQTT broker for device communication
- **Workflow Engine**: Custom workflow execution system

## Development and Deployment

### Local Development Setup

1. Install dependencies: `npm install`
2. Set up PostgreSQL database
3. Run Prisma migrations: `npm run prisma:migrate --workspace=backend`
4. Start services: `npm run dev`
5. Python environment for ML features (separate setup required)

### Build and Deployment Process

- **Build**: `npm run build` (compiles TypeScript, bundles frontend)
- **Docker**: Multi-stage builds for each service
- **Deployment**: Kubernetes manifests in `infrastructure/`
- **CI/CD**: GitHub Actions for automated testing and deployment

## Testing Reality

### Current Test Coverage

- Unit Tests: Jest for backend services and frontend components
- Integration Tests: API endpoint testing with test database
- E2E Tests: Playwright for critical user flows
- Performance Tests: Basic load testing setup
- Accessibility: axe-core integration in frontend tests

### Running Tests

```bash
npm run test              # All workspaces
npm run test:backend      # Backend only
npm run test:dashboard    # Frontend only
```

## Story 17.2 Enhancement Impact Analysis

### Files That Will Need Modification

Based on the BI Dashboard requirements, these files will be affected:

- `dashboard/src/pages/Dashboard.tsx` - Add analytics widgets
- `backend/src/routes/analytics.ts` - New API endpoints (create if missing)
- `backend/src/services/analyticsService.ts` - Data aggregation logic
- `dashboard/src/components/` - New chart components
- `backend/prisma/schema.prisma` - Potential analytics data models

### New Files/Modules Needed

- `dashboard/src/components/AnalyticsDashboard.tsx` - Main dashboard container
- `dashboard/src/components/widgets/KPICard.tsx` - KPI display component
- `dashboard/src/components/widgets/ChartWidget.tsx` - Chart visualization
- `backend/src/routes/analytics.ts` - Analytics API routes
- `backend/src/services/analyticsService.ts` - Analytics business logic

### Integration Considerations

- Will need to integrate with existing Socket.io for real-time updates
- Must follow existing Material-UI design patterns
- Should use existing chart libraries (Chart.js, Recharts)
- API responses should match existing REST patterns
- Database queries should leverage existing Prisma models

## Appendix - Useful Commands and Scripts

### Development Commands

```bash
npm run dev                    # Start all services
npm run dev:backend           # Backend only
npm run dev:dashboard         # Frontend only
npm run prisma:studio         # Database GUI
npm run prisma:migrate        # Run migrations
npm run db:seed              # Seed database
```

### Build Commands

```bash
npm run build                # Build all services
npm run build:backend        # Backend build
npm run build:dashboard      # Frontend build
```

### Testing Commands

```bash
npm run test                 # Run all tests
npm run test:coverage        # With coverage report
npm run lint                 # Code linting
```

## Success Criteria

The brownfield architecture documentation is successful when:

1. AI agents can understand the current system structure
2. Integration points for Story 17.2 are clearly identified
3. Technical debt and constraints are documented
4. Development setup and commands are accurate
5. File paths and naming conventions are consistent with actual codebase