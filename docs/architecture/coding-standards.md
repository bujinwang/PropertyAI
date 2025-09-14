# Coding Standards - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Define coding conventions, best practices, and extensions for new features like AI reporting (21.4). Standards ensure maintainability, security, and consistency in the existing codebase.

## General Principles

- **Language:** JavaScript (backend), TypeScript (frontend preferred for new code).
- **Style Guide:** Airbnb ESLint config with Prettier for formatting.
- **Commit Messages:** Conventional Commits (feat:, fix:, docs:, etc.).
- **Branching:** Feature branches from main (e.g., feat/21.4-reporting).
- **Code Reviews:** All PRs require 1 approval; use checklists for DoD.
- **Documentation:** JSDoc for functions; inline comments for complex logic.

## Backend Standards (Node.js/Express/Sequelize)

### Naming Conventions
- **Files:** kebab-case.js (e.g., market-data-service.js)
- **Classes:** PascalCase (e.g., MarketDataService)
- **Functions:** camelCase (e.g., fetchMarketData)
- **Variables:** camelCase; constants UPPER_SNAKE_CASE
- **Database:** snake_case for fields (e.g., monthly_rent)

### Code Structure
- **Services:** Single responsibility; async/await only; no callbacks.
- **Routes:** Group by domain (e.g., routes/reports.js); use router.param for IDs.
- **Models:** Sequelize define with validations (allowNull: false where appropriate).
- **Error Handling:** Try-catch all async; custom Error classes for types (ValidationError, ApiError).
- **Logging:** Console.log for dev; Winston for prod (levels: error, warn, info).

### Security Standards
- **Auth:** JWT for all protected routes; validate roles in middleware.
- **Validation:** Joi schemas for requests; sanitize inputs to prevent injection.
- **Secrets:** Environment variables only; no hardcoding (use .env.example).
- **Data Protection:** Hash passwords (bcrypt); encrypt sensitive fields (e.g., PII in reports).

### Performance Standards
- **Async:** All I/O operations async; avoid blocking.
- **Caching:** Use node-cache or Redis for expensive operations (TTL based on data freshness).
- **Queries:** Index DB fields; limit results; use includes for joins.
- **Timeouts:** Axios 10s for external calls; connection pooling for DB.

**Extensions for AI Reporting (21.4):**
- **AI Code:** Include confidence scores in all generated content; log AI decisions for audit.
- **Report Generation:** Limit concurrent generations to 5; use queues for large reports.
- **NLP Standards:** Use OpenAI API or similar; template prompts for consistency; validate outputs for bias/sensitivity.

## Frontend Standards (React/TypeScript/MUI)

### Naming Conventions
- **Files:** PascalCase.tsx (e.g., ReportDashboard.tsx)
- **Components:** PascalCase (e.g., ReportPreview)
- **Hooks:** camelCase (e.g., useReportGeneration)
- **Variables:** camelCase; constants UPPER_SNAKE_CASE

### Code Structure
- **Components:** Functional with hooks; atomic design (atoms to pages).
- **State Management:** useState/useEffect for local; Redux/Context for global.
- **API Calls:** Custom hooks in services/ (e.g., useQuery from React Query if added).
- **Error Handling:** ErrorBoundary components; user-friendly messages.
- **Styling:** MUI theme; sx props for custom; no inline styles.

### Accessibility Standards
- **ARIA:** Labels on interactive elements; roles for sections.
- **Keyboard:** Tab navigation; focus management.
- **Contrast:** WCAG 2.1 AA compliant colors.

**Extensions for Reporting (21.4):**
- **AI Content:** Components must display sources and confidence (e.g., Chip for scores).
- **Report UI:** Support keyboard-only navigation for template builders.
- **Export:** Ensure PDF exports include alt text for charts.

## Testing Standards
- **Unit:** 95% coverage; mock dependencies; test all branches.
- **Integration:** 90% for APIs; real DB where possible.
- **E2E:** Critical workflows; Cypress for UI.
- **Tools:** Jest/RTL for frontend; Supertest for backend.

**For AI Reporting (21.4):**
- Test AI outputs for accuracy/bias; mock ML models.
- Validate report generation end-to-end.

## Documentation Standards
- **JSDoc:** All functions with @param, @returns, @throws.
- **Inline Comments:** Complex logic only; prefer self-documenting code.
- **Changelogs:** In story files for features.

**For 21.4:** All AI prompts documented; report templates versioned.

## Linting and Formatting
- **ESLint:** .eslintrc.js config (airbnb-base for JS, @typescript-eslint for TS).
- **Prettier:** .prettierrc for formatting.
- **Run:** `npm run lint` before commit.

## Extensions for Reporting (21.4)
- **AI Integration:** Code must handle API rate limits; include error fallbacks.
- **New Modules:** Follow structure: services/ for logic, routes/ for endpoints.
- **Compliance:** Reports log AI usage; ensure GDPR for tenant data.

**Note:** This brownfield standards doc reflects current practices. 21.4 extensions maintain consistency while adding AI-specific guidelines for reliability and auditability.