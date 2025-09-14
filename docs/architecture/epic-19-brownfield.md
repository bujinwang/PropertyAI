# PropertyAI Brownfield Architecture: Epic 19 - Payment Integration

## Introduction

This document captures the current state and planned brownfield enhancements for payment integration in PropertyAI, building on the existing MVP (Epics 1-18: property management, AI matching, tenant screening, marketplace). Focus: Additive Stripe integration for rent collection without disrupting core features (e.g., matching/screening workflows remain unchanged).

### Document Scope
- Existing: Basic rent tracking in Unit/Tenant models (due dates/amounts, no processing).
- Enhancements: Stripe for cards/ACH/recurring; invoices, status tracking, notifications.
- Impact: Extend Tenant model, add services/routes/models; update Dashboard UI.
- Non-Goals: No new auth (reuse existing); no full e-commerce (rent-focused only).

### Change Log
| Date       | Version | Description                          | Author   |
|------------|---------|--------------------------------------|----------|
| 2025-09-14 | 1.0     | Initial brownfield for Epic 19       | Winston |

## Quick Reference - Key Files and Entry Points

### Critical Files for Payment Integration
- **Main Entry**: src/index.js (add Stripe middleware if needed).
- **Configuration**: config/stripe.config.js (API keys, webhooks); .env (STRIPE_SECRET_KEY).
- **Core Business Logic**: src/services/paymentService.js (new: process/setup); src/services/tenantService.js (extend for methods).
- **API Definitions**: src/routes/payment.js (new endpoints); reuse src/middleware/auth.js.
- **Database Models**: src/models/Tenant.js (extend); src/models/Payment.js, Invoice.js (new).
- **Key Algorithms**: src/services/invoiceGenerator.js (new: PDF via pdf-lib); webhook handler for status sync.
- **Frontend**: src/components/PaymentHistory.tsx (new tab in Dashboard); src/pages/Dashboard.tsx (integrate).

### Enhancement Impact Areas
- Backend: +3 models/services/routes; webhooks endpoint.
- Frontend: +1 component, Dashboard update.
- DB: Additive JSON fields (no migrations for core schemas).

## High Level Architecture

### Actual Tech Stack
| Category     | Technology       | Version | Notes                                      |
|--------------|------------------|---------|--------------------------------------------|
| Runtime      | Node.js          | 18.x    | Existing; Stripe SDK compatible.           |
| Framework    | Express.js       | 4.x     | Add Stripe webhook route with sig verify.  |
| ORM/DB       | Sequelize/PostgreSQL | Latest | Extend Tenant; new Payment/Invoice models. |
| Frontend     | React/MUI        | 18.x    | New PaymentHistory component; responsive.  |
| Payments     | Stripe           | 14.x    | Cards/ACH/recurring; webhooks for async.   |
| Notifications| Existing (mock)  | -       | Extend for payment alerts (email/SMS).     |
| Testing      | Jest/RTL/nock    | -       | 95% coverage target; Stripe test mode.     |
| Logging      | Winston          | -       | Audit all payment events.                  |

### Repository Structure Reality Check
- Type: Monorepo (dashboard/src).
- Package Manager: npm.
- Notable: Existing auth/rateLimit middleware reusable; no breaking changes.

## Source Tree and Module Organization

### Project Structure (Post-Enhancement)
```
dashboard/
├── src/
│   ├── models/          # Extend Tenant; add Payment.js, Invoice.js (associations: Tenant.hasMany(Payments))
│   ├── services/        # New: paymentService.js (Stripe ops), invoiceService.js; extend tenantService.js
│   ├── routes/          # New: payment.js (/setup, /process, /webhook); extend application.js
│   ├── middleware/      # Reuse auth.js; add stripeWebhook.js (signature verify)
│   ├── utils/           # New: stripeUtils.js (tokenize, refund); pdfGenerator.js
│   └── config/          # New: stripe.config.js
├── dashboard/src/       # Frontend
│   ├── components/      # New: PaymentHistory.tsx (table with status, history)
│   ├── pages/           # Dashboard.tsx: Add payments tab (use PaymentHistory)
│   └── services/        # api.ts: Add payment endpoints (React Query)
└── tests/               # New: payment.test.js (nock Stripe), PaymentHistory.test.tsx
```

### Key Modules and Their Purpose
- **Payment Service**: Handles Stripe createPaymentMethod, processPayment, subscription setup; idempotency keys for retries.
- **Invoice Service**: Generates PDF invoices (pdf-lib); cron for due date reminders (extend existing scheduler).
- **Webhook Handler**: Listens for Stripe events (payment.succeeded/failed); updates DB status, triggers notifications.
- **Tenant Extension**: Add paymentMethods JSON (Stripe IDs), lastPaymentDate.
- **PaymentHistory Component**: MUI DataGrid for history; filters by status/tenant.

## Data Models and APIs

### Data Models
- **Tenant Extension**: See src/models/Tenant.js (add: paymentMethods: JSONB {cards: [], ach: {}}, subscriptionId: STRING).
- **Payment Model** (new): id, tenantId, amount, status (pending/paid/failed/refunded), stripePaymentId, createdAt.
- **Invoice Model** (new): id, unitId, tenantId, dueDate, amount, status, pdfUrl, payments: [Payment IDs].
- Associations: Tenant.hasMany(Invoices); Invoice.hasMany(Payments); Unit.belongsTo(Tenant).

### API Specifications
- **New Endpoints** (payment.js):
  - POST /api/payment/setup: Save method (body: {type: 'card|ach', details}); returns Stripe ID.
  - POST /api/payment/process: Charge (body: {invoiceId, methodId}); async, returns intent.
  - POST /api/payment/webhook: Stripe events; verify sig, update status.
  - GET /api/payment/history/:tenantId: List payments/invoices.
- **Existing Reuse**: /api/tenant (update for methods); notifications for paid/overdue.
- Auth: JWT required; rateLimit on process (10/min per tenant).

## Technical Debt and Known Issues
- **Current Debt**: Manual rent tracking (no auto-invoicing); potential for duplicate charges if webhooks fail.
- **New Debt**: Stripe dependency (vendor lock-in); handle regional availability (ACH US-only).
- **Workarounds**: Use Stripe test mode for dev; mock webhooks with ngrok for local testing.
- **Gotchas**: Webhook retries (idempotent); PCI: Never store card details (use Stripe Elements).

## Integration Points and External Dependencies
### External Services
| Service | Purpose              | Integration Type | Key Files                     |
|---------|----------------------|------------------|-------------------------------|
| Stripe  | Payments/subscriptions | SDK + Webhooks  | src/services/paymentService.js |
| pdf-lib | Invoice PDFs        | Library         | src/utils/pdfGenerator.js     |

### Internal Integration Points
- **Backend**: Extend tenantService for payments; integrate with NotificationService (e.g., on succeeded).
- **Frontend**: Dashboard tab fetches /history; use Stripe Elements for forms (secure tokenization).
- **DB**: Triggers for overdue (if supported); audit logs via Winston.
- **Existing**: Reuse auth for protected routes; marketplace workflow (post-approve, prompt payment setup).

## Development and Deployment
### Local Development Setup
1. npm install stripe pdf-lib
2. Add STRIPE_SECRET_KEY to .env; use test keys.
3. ngrok for webhook testing: ngrok http 3000; update Stripe webhook URL.
4. Run: npm run dev; test with Stripe CLI.

### Build and Deployment Process
- Build: npm run build (existing).
- Deployment: Update env with live keys; configure webhook endpoint in Stripe dashboard.
- Environments: Dev (test mode), Staging (sandbox), Prod (live); monitor via Stripe dashboard.

## Testing Reality
- Unit: Jest for services (nock Stripe mocks, 95% coverage).
- Integration: Test webhook handling, DB updates.
- E2E: Cypress for payment flow (Stripe test cards); verify notifications.
- Load: k6 for /process (<2s p95); 100 VU.
- Security: OWASP tests for webhooks; PCI compliance via Stripe.

## Impact Analysis for Epic 19
### Files That Will Need Modification
- src/models/Tenant.js: Add payment fields.
- src/services/tenantService.js: Update for methods.
- src/pages/Dashboard.tsx: Add payments tab.
- src/services/NotificationService.ts: Extend for payments.

### New Files/Modules Needed
- src/models/Payment.js, Invoice.js.
- src/services/paymentService.js, invoiceService.js.
- src/routes/payment.js.
- src/utils/stripeUtils.js, pdfGenerator.js.
- dashboard/src/components/PaymentHistory.tsx.

### Integration Considerations
- Webhooks: Secure endpoint with Stripe sig; async status updates (no blocking).
- Compliance: Consent in Tenant model; encrypt PII in logs.
- Performance: Offload PDF gen to queue if >100ms.
- Rollback: Feature flag for new routes; DB schema reversible.