# Epic 4: Lease Management

## Goal
Enable comprehensive lease management within the PropertyAI dashboard, allowing users to create, view, update, and track leases for tenants, including terms, renewals, and payment schedules. This builds on tenant and unit foundations to support full lease lifecycle management, ensuring seamless integration with existing data models and UI patterns for a cohesive user experience.

## Description
This epic focuses on brownfield enhancements to the frontend dashboard for lease-related features. Leases represent agreements between tenants and property owners, with key attributes like start/end dates, rent amount, payment frequency, renewal options, and status (active, expired, renewed). Features must align with existing Material UI components, API services, and accessibility standards, inferring backend support from Prisma Lease model (relations to Tenant and Unit via foreign keys, optional Property indirect link).

Enhancements are low-risk, extending dashboardService.ts for lease APIs (/api/leases for CRUD, /api/leases/{id}/payments, /api/leases/{id}/renew), without requiring schema migrations. UI will include list views, forms, renewal modals, payment tracking, and integration into TenantDetail/PropertyDetail for contextual actions.

## Stories Outline
- **Story 4.1: Lease CRUD UI** - Implement create, read, update, delete operations for leases with search, pagination, and validation. Add navigation route '/leases' and link from sidebar/dashboard summaries.
- **Story 4.2: Lease-Tenant Association and Payment Tracking** - Enable associating leases to tenants/units, tracking payments (due/overdue), handling renewals, and updating lease status. Integrate with existing tenant/property views for end-to-end workflows.

## Compatibility Requirements
- Integrate with existing backend APIs; assume Lease model exists in Prisma schema with fields (id, tenantId, unitId, startDate, endDate, rentAmount, paymentFrequency, status, renewalOptions).
- Use current React Query setup in queryClient.ts for caching lease data.
- Maintain backward compatibility: No changes to Tenant/Unit models; leases via soft relations or updates to tenant.leaseId.
- UI must match Material UI v5+ theme, responsive breakpoints, and WCAG 2.1 AA (ARIA labels, keyboard nav).
- Error handling via Snackbar, auth headers in dashboardService.ts.

## Risk Mitigation
- Data integrity: Form validation prevents invalid dates (e.g., endDate < startDate), duplicate leases, or negative amounts.
- Performance: Pagination for lease lists; optimistic updates for renewals/payments with rollback on API failure.
- Testing: Unit/integration tests for forms, lists, payments; mock APIs to isolate frontend.
- Rollback: UI-only changes; if issues arise, remove routes/components without affecting core dashboard.
- Dependencies: Infer API extensions; if backend gaps, note in dev records for future sync.

## Definition of Done
- All outlined stories are implemented, validated with story-dod-checklist.md, and marked Complete.
- New components integrated without regressions (existing tests pass, no console errors).
- Manual QA: Responsive on mobile/desktop, accessible (Axe scan passes), end-to-end flow (create lease → associate to tenant → track payments → renew).
- Documentation: Dev Agent Records in stories; updated navigation in Layout.tsx.
- No open bugs; ready for next epic (e.g., Maintenance Tracking).