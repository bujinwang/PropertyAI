# Epic 3: Tenant Management

## Goal
Enable comprehensive tenant management within the PropertyAI dashboard, allowing users to create, view, update, and assign tenants to units. This builds on the property and unit foundation to support full lifecycle management, ensuring seamless integration with existing data models and UI patterns for a cohesive user experience.

## Description
This epic focuses on brownfield enhancements to the frontend dashboard for tenant-related features. Tenants represent individuals or entities occupying units, with key attributes like name, contact info, lease details, and status (active, pending, evicted). Assignment links tenants to specific units, supporting move-ins/outs and vacancy tracking. Features must align with existing Material UI components, API services, and accessibility standards, inferring backend support from Prisma Tenant model (relations to Unit via foreign key, optional Property indirect link).

Enhancements are low-risk, extending dashboardService.ts for tenant APIs (/api/tenants for CRUD, /api/tenants/{id}/assign-unit), without requiring schema migrations. UI will include list views, forms, assignment modals, and integration into PropertyDetail/UnitsList for contextual actions.

## Stories Outline
- **Story 3.1: Tenant CRUD UI** - Implement create, read, update, delete operations for tenants with search, pagination, and validation. Add navigation route '/tenants' and link from sidebar/dashboard summaries.
- **Story 3.2: Tenant-Unit Assignment Management** - Enable assigning tenants to units (single/bulk), viewing assignments in tenant/property details, handling move-outs, and updating vacancy status. Integrate with existing unit/property views for end-to-end workflows.

## Compatibility Requirements
- Integrate with existing backend APIs; assume Tenant model exists in Prisma schema with fields (id, name, email, phone, leaseStart, leaseEnd, status, unitId).
- Use current React Query setup in queryClient.ts for caching tenant data.
- Maintain backward compatibility: No changes to Property/Unit models; assignments via soft relations or updates to unit.tenantId.
- UI must match Material UI v5+ theme, responsive breakpoints, and WCAG 2.1 AA (ARIA labels, keyboard nav).
- Error handling via Snackbar, auth headers in dashboardService.ts.

## Risk Mitigation
- Data integrity: Form validation prevents duplicate assignments or invalid dates (e.g., leaseStart < current date).
- Performance: Pagination for tenant lists; optimistic updates for assignments with rollback on API failure.
- Testing: Unit/integration tests for forms, lists, assignments; mock APIs to isolate frontend.
- Rollback: UI-only changes; if issues arise, remove routes/components without affecting core dashboard.
- Dependencies: Infer API extensions; if backend gaps, note in dev records for future sync.

## Definition of Done
- All outlined stories are implemented, validated with story-dod-checklist.md, and marked Complete.
- New components integrated without regressions (existing tests pass, no console errors).
- Manual QA: Responsive on mobile/desktop, accessible (Axe scan passes), end-to-end flow (create tenant → assign to unit → view in property detail).
- Documentation: Dev Agent Records in stories; updated navigation in Layout.tsx.
- No open bugs; ready for next epic (e.g., Lease Management).