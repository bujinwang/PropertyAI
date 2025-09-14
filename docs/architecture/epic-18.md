# Epic 18: AI-Powered Property Matching and Tenant Screening Marketplace - Brownfield Architecture

## Introduction

This brownfield architecture document captures the current system state and proposed enhancements for Epic 18, focusing on AI-driven property matching and tenant screening marketplace. It documents existing patterns, technical debt, integration constraints, and the incremental design to add marketplace functionality while maintaining system stability.

### Document Scope

Focused on Epic 18 requirements from docs/prd/epic-18.md. Enhancements integrate with existing PropertyAI stack (React dashboard, mobile app, PostgreSQL backend, ML from Epic 17) without major refactoring. Key areas: AI matching engine, screening workflows, marketplace UI/API.

### Change Log

| Date       | Version | Description                          | Author     |
|------------|---------|--------------------------------------|------------|
| 2025-09-12 | 1.0     | Initial brownfield architecture for Epic 18 | Winston (Architect) |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry (Dashboard)**: `dashboard/src/pages/Dashboard.tsx` – Existing dashboard; add marketplace tab/link.
- **Configuration**: `backend/config/app.config.js`, `.env.example` – Add marketplace API keys (e.g., Checkr, TransUnion).
- **Core Business Logic**: `backend/src/services/` – Extend tenantService.js, propertyService.js for matching; new marketplaceService.js.
- **API Definitions**: `backend/src/routes/` – Add /api/marketplace routes; extend OpenAPI spec in docs/api/openapi.yaml.
- **Database Models**: `backend/src/models/` – Extend Tenant, Property models with marketplace fields (e.g., matchingScore, screeningStatus).
- **ML Integration**: `backend/src/services/analyticsService.js` (from Epic 17) – Reuse for matching models.
- **Key Algorithms**: New matchingAlgorithm.js in backend/src/services/; screeningWorkflow.js.

### Enhancement Impact Areas

- **Backend**: New marketplace module; extend tenant/property services for AI scoring.
- **Frontend**: New Marketplace page/component in dashboard/src/pages/; mobile screens in propertyapp/src/screens/.
- **Database**: Additive schema changes (matching logs, screening reports); no breaking migrations.
- **Infra**: Existing GKE/SQL/PubSub; add Redis for match caching if needed.

## High Level Architecture

### Technical Summary

PropertyAI current stack: React/TS frontend (MUI), Node.js/Express backend, PostgreSQL DB, ML via TensorFlow.js/Python API (Epic 17), Terraform infra on GCP. Marketplace adds AI layer on existing data flow, with new external integrations (credit APIs).

### Actual Tech Stack

| Category     | Technology       | Version | Notes |
|--------------|------------------|---------|-------|
| Frontend     | React/TS, MUI    | 18.x    | Existing dashboard patterns; add marketplace routes in App.tsx. |
| Backend      | Node.js/Express  | 20.x    | Extend routes/services; reuse auth middleware. |
| Database     | PostgreSQL       | 15      | Additive tables (marketplace_matches, screening_reports); existing indexes ok. |
| ML/AI        | TensorFlow.js    | Latest  | Reuse Epic 17 engine; new models for matching (e.g., collaborative filtering). |
| Integrations | Checkr API, TransUnion | N/A     | New; secure with API keys in Secret Manager. |
| Caching      | Redis (optional) | If added| For match recommendations; existing PubSub for notifications. |

### Repository Structure Reality Check

- Monorepo with dashboard/, backend/, mobile/, infrastructure/.
- Marketplace fits as new subfolder in backend/src/services/marketplace/, dashboard/src/pages/Marketplace.tsx.
- No major changes to root structure; add marketplace-specific scripts in scripts/.

## Source Tree and Module Organization

### Project Structure (Actual + Proposed)

```
project-root/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── marketplaceService.js  # New: Matching, screening logic
│   │   │   ├── tenantService.js       # Extend: Add screening workflow
│   │   │   └── propertyService.js     # Extend: Matching eligibility
│   │   ├── models/
│   │   │   ├── MarketplaceMatch.js    # New: Match records
│   │   │   └── ScreeningReport.js     # New: Screening results
│   │   └── routes/
│       └── marketplaceRoutes.js       # New: /api/marketplace endpoints
├── dashboard/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Marketplace.tsx        # New: Marketplace UI
│   │   ├── components/
│   │   │   ├── MatchingResults.tsx    # New: Display matches
│   │   │   └── ScreeningWorkflow.tsx  # New: Screening interface
│   │   └── services/
│       └── marketplaceService.ts      # New: Frontend API calls
└── infrastructure/
    └── modules/                       # Existing GCP; add if scaling needed
```

### Key Modules and Their Purpose

- **Marketplace Service**: backend/src/services/marketplaceService.js – Core matching AI, screening orchestration.
- **Tenant Service Extension**: backend/src/services/tenantService.js – Integrate screening into onboarding.
- **Property Service Extension**: backend/src/services/propertyService.js – Add marketplace visibility/optimization.
- **Frontend Marketplace**: dashboard/src/pages/Marketplace.tsx – Self-service UI for search/applications.
- **Mobile Integration**: propertyapp/src/screens/MarketplaceScreen.tsx – Reuse components for mobile.

## Data Models and APIs

### Data Models

Reference existing + new:

- **Tenant Model Extension**: Add matchingProfile, screeningStatus to src/models/Tenant.js.
- **Property Model Extension**: Add marketplaceVisibility, matchingCriteria to src/models/Property.js.
- **New Models**: MarketplaceMatch (id, tenantId, propertyId, score, status); ScreeningReport (id, tenantId, creditScore, backgroundCheck, riskLevel).
- Types: TS interfaces in dashboard/src/types/marketplace.ts.

### API Specifications

- **New Endpoints**:
  - GET /api/marketplace/matches?tenantId=123 – Return ranked properties.
  - POST /api/marketplace/screen – Submit screening request.
  - GET /api/marketplace/applications/{id} – Track application status.
- Extend OpenAPI: docs/api/openapi.yaml – Add marketplace section.
- Auth: Reuse JWT from existing auth; add marketplace permissions.

## Technical Debt and Known Issues

### Critical Technical Debt

1. **ML Scalability**: Epic 17 models may need optimization for real-time matching; current TensorFlow.js in-memory limits.
2. **External API Reliability**: No fallback for Checkr/TransUnion; add retry/circuit breaker.
3. **Data Privacy**: Existing tenant data handling ok, but marketplace requires enhanced consent (GDPR).
4. **Frontend State**: Dashboard state management (Context/Redux?) – ensure marketplace fits without refactor.

### Workarounds and Gotchas

- **Third-Party Keys**: Store in GCP Secret Manager; existing env vars for similar.
- **Matching Bias**: Manual audit required; no automated in current ML pipeline.
- **Mobile Sync**: Ensure WebSocket notifications work across dashboard/mobile.

## Integration Points and External Dependencies

### External Services

| Service     | Purpose                  | Integration Type | Key Files |
|-------------|--------------------------|------------------|-----------|
| Checkr      | Background screening     | REST API         | marketplaceService.js |
| TransUnion  | Credit checks            | REST API         | screeningWorkflow.js |
| Twilio      | Application notifications| SMS API          | notificationService.js (existing) |

### Internal Integration Points

- **Dashboard Communication**: New marketplace routes in Express; frontend fetches via axios in services.
- **Background Jobs**: PubSub for screening results; existing Redis for caching matches.
- **ML Engine**: Reuse Epic 17 analyticsService for matching models.

## Development and Deployment

### Local Development Setup

1. Existing setup; add .env vars for Checkr/TransUnion keys.
2. Run ML models locally via docker-compose (extend existing).
3. Test integrations with mock APIs (nock.js).

### Build and Deployment Process

- **Build**: Existing npm run build; no changes.
- **Deployment**: Terraform applies; add marketplace module if scaling.
- **Environments**: Dev/Staging/Prod; sandbox for third-party APIs.

## Testing Reality

### Current Test Coverage

- Unit: 70% backend services; add for marketplace.
- Integration: Mock external APIs for screening.
- E2E: Cypress for marketplace flow; extend existing.

### Running Tests

```bash
npm test  # Unit/integration
npm run test:e2e  # Marketplace workflows
```

## Enhancement Impact Analysis

### Files That Will Need Modification

- `backend/src/services/tenantService.js` – Add screening integration.
- `dashboard/src/App.tsx` – Add Marketplace route.
- `src/models/Tenant.js` – Extend schema for marketplace fields.

### New Files/Modules Needed

- `backend/src/services/marketplaceService.js` – Core logic.
- `dashboard/src/pages/Marketplace.tsx` – UI.
- `dashboard/src/components/MatchingResults.tsx` – Results display.

### Integration Considerations

- Reuse auth/permission from Epic 2 for marketplace access.
- Ensure matching data flows to lease management (Epic 4).
- Compliance: Add consent checks in tenant onboarding.

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run dev:marketplace  # Start with marketplace mocks
npm run test:screening   # Test third-party mocks
terraform apply -var-file=environments/dev/terraform.tfvars
```

### Debugging and Troubleshooting

- **Logs**: backend/logs/marketplace.log for API issues.
- **Debug Mode**: DEBUG=marketplace:* for matching details.
- **Common Issues**: API rate limits – add retries in service.