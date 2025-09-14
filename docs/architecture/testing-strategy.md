# Testing Strategy - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Define testing approach, tools, coverage goals, and extensions for new features like AI reporting (21.4). Strategy emphasizes unit/integration for reliability, with E2E for user flows.

## Testing Philosophy

- **Risk-Based:** Prioritize high-risk areas (external APIs, AI predictions, payments).
- **Shift-Left:** Unit tests first, integration early, E2E for critical paths.
- **Automation-First:** All tests automated; manual for exploratory/UI polish.
- **Coverage Goals:** 95% unit, 90% integration, 80% E2E.
- **CI/CD Integration:** Tests run on PRs via package.json scripts (jest --coverage).
- **Environments:** Unit/integration on local; E2E on staging with mocks.

## Testing Tools

### Backend (Node.js/Express/Sequelize)
- **Unit:** Jest for services/models (mock DB with SQLite in-memory).
- **Integration:** Supertest for API endpoints (mock external services).
- **API Testing:** Postman/Newman for contract testing (manual initially).
- **Load/Performance:** Artillery for API load tests.
- **Security:** OWASP ZAP for vulnerability scans (CI step).

### Frontend (React/TypeScript/MUI)
- **Unit/Component:** Jest + React Testing Library for components/hooks.
- **E2E:** Cypress for user workflows (headless in CI).
- **Accessibility:** axe-core for a11y audits.
- **Visual Regression:** Percy (visual diffs on screenshots).

### Shared
- **Linting:** ESLint/Prettier for code quality.
- **Type Checking:** TypeScript compiler.
- **Coverage:** Istanbul (nyc) for reports (>90% threshold in CI).

## Test Types and Coverage

### Unit Tests
- **Scope:** Individual functions/methods in services, models, utils.
- **Focus:** Logic, calculations, error paths (e.g., pricing algorithms in 21.3).
- **Mocking:** Mock dependencies (DB, APIs) to isolate units.
- **Target:** 95% coverage; all branches executed.
- **Execution:** `jest --coverage` (backend/frontend).

**For Reporting (21.4):**
- Test AI insight generation (mock ML models).
- Validate template rendering logic.
- Edge cases: Empty data, low confidence AI outputs.

### Integration Tests
- **Scope:** API endpoints, service interactions (e.g., route → service → model).
- **Focus:** Data flow, error propagation, auth (e.g., reports endpoint chains).
- **Mocking:** Mock external (APIs) but real DB for integration.
- **Target:** 90% coverage; all endpoints tested.
- **Execution:** `jest --runInBand` for sequential.

**For Reporting (21.4):**
- Test report generation pipeline (template → data → output).
- Verify export formats (PDF via puppeteer, CSV via json2csv).
- Integration with analytics (e.g., fetch churn data for reports).

### E2E Tests
- **Scope:** User journeys across frontend/backend (e.g., login → generate report → export).
- **Focus:** UI interactions, full workflows, performance under load.
- **Mocking:** Mock external APIs; real backend where possible.
- **Target:** 80% coverage for critical paths.
- **Execution:** Cypress via `cypress run` in CI.

**For Reporting (21.4):**
- User creates template → generates report → schedules delivery.
- Verify email delivery (mock SMTP).
- Test report viewing/export on dashboard.

### Performance Tests
- **Scope:** Load testing for API endpoints (e.g., report generation <30s).
- **Tools:** Artillery scripts in `tests/performance/`.
- **Metrics:** Response time <500ms P95, throughput >100 rps.
- **Thresholds:** Fail CI if exceeded.

**For Reporting (21.4):**
- Stress test AI report generation with large datasets.
- Measure PDF export times.

### Security Tests
- **Scope:** Auth bypass, injection, access control.
- **Tools:** Manual review + automated scans (ZAP).
- **Focus:** Report data privacy (PII redaction), API keys.

**For Reporting (21.4):**
- Test audit trails for AI content.
- Verify role-based access to sensitive reports.

## Test Data Strategy

- **Seed Data:** Use `scripts/mongodb-seed/` for test DB population (properties, tenants, etc.).
- **Mock Data:** Realistic fakes for external APIs (e.g., market data from 21.3).
- **Edge Cases:** Invalid inputs, empty results, high-load scenarios.
- **Test Users:** Admin, manager, tenant roles with permissions.

## Test Execution and CI/CD

### Local Development
- Backend: `npm test` (unit + integration)
- Frontend: `npm run test` (Jest)
- Full: `npm run test:full` (all + lint)

### CI/CD Pipeline
- **PR Checks:** Lint → Unit → Integration → Coverage report.
- **Merge Gates:** E2E + performance if coverage >90%.
- **Post-Deploy:** Smoke tests on staging.

**For Reporting (21.4):**
- Add tests to pipeline for new endpoints.
- Mock AI/ML responses for consistent CI.

## Test Maintenance

- **Coverage Threshold:** PR blocks if <90%.
- **Flaky Test Policy:** Quarantine and fix within 1 sprint.
- **Data Refresh:** Update seeds quarterly.
- **Documentation:** Tests include descriptions; update with features.

**Note:** This strategy reflects current brownfield testing practices. For 21.4, emphasize AI model mocking and report workflow testing to ensure reliability.