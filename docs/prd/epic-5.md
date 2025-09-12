# Epic 5: Maintenance Tracking

## Goal
Enable comprehensive maintenance tracking within the PropertyAI dashboard, allowing tenants to submit maintenance requests and property managers to create, schedule, and track work orders for resolution. This builds on tenant and unit foundations to support full maintenance lifecycle management, ensuring seamless integration with existing data models and UI patterns for efficient property upkeep and tenant satisfaction.

## Description
This epic focuses on brownfield enhancements to the frontend dashboard for maintenance-related features. Maintenance requests represent tenant-submitted issues (e.g., plumbing, electrical, HVAC), with attributes like description, priority, status, and timestamps. Work orders represent scheduled responses, with assignments, due dates, and completion tracking. Features must align with existing Material UI components, API services, and accessibility standards, inferring backend support from Prisma MaintenanceRequest/WorkOrder models (relations to Tenant, Unit, Property via foreign keys).

Enhancements are low-risk, extending dashboardService.ts for maintenance APIs (/api/maintenance-requests for CRUD, /api/work-orders for scheduling/tracking), without requiring schema migrations. UI will include request forms, list views, work order modals, status updates, and integration into TenantDetail/PropertyDetail for contextual actions.

## Stories Outline
- **Story 5.1: Maintenance Request CRUD UI** - Implement create, read, update, delete operations for maintenance requests with search, filtering by status/priority, and validation. Add tenant-facing form and manager list view with navigation route '/maintenance-requests'.
- **Story 5.2: Work Order Scheduling and Tracking** - Enable creating work orders from requests, assigning staff/dates, tracking progress (pending → in progress → completed), and updating request status. Integrate with existing property/tenant views for end-to-end workflows.

## Compatibility Requirements
- Integrate with existing backend APIs; assume MaintenanceRequest model exists in Prisma schema with fields (id, tenantId, unitId, propertyId, description, priority, status, submittedAt, updatedAt).
- Assume WorkOrder model with fields (id, requestId, assignedStaff, scheduledDate, completedDate, notes, status).
- Use current React Query setup in queryClient.ts for caching maintenance data.
- Maintain backward compatibility: No changes to Tenant/Unit/Property models; maintenance via soft relations.
- UI must match Material UI v5+ theme, responsive breakpoints, and WCAG 2.1 AA (ARIA labels, keyboard nav).
- Error handling via Snackbar, auth headers in dashboardService.ts.

## Risk Mitigation
- Data integrity: Form validation prevents invalid priorities, duplicate requests, or missing descriptions.
- Performance: Pagination for request lists; optimistic updates for status changes with rollback on API failure.
- Testing: Unit/integration tests for forms, lists, work orders; mock APIs to isolate frontend.
- Rollback: UI-only changes; if issues arise, remove routes/components without affecting core dashboard.
- Dependencies: Infer API extensions; if backend gaps, note in dev records for future sync.

## Definition of Done
- All outlined stories are implemented, validated with story-dod-checklist.md, and marked Complete.
- New components integrated without regressions (existing tests pass, no console errors).
- Manual QA: Responsive on mobile/desktop, accessible (Axe scan passes), end-to-end flow (tenant submits request → manager creates work order → tracks to completion).
- Documentation: Dev Agent Records in stories; updated navigation in Layout.tsx.
- No open bugs; ready for next epic (e.g., Financial Management).