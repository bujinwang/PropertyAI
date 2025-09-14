# REST API Specification - PropertyAI Brownfield Architecture

**Document Version:** 1.0 (Brownfield)
**Last Updated:** 2025-09-14
**Purpose:** Document existing REST API endpoints, patterns, and extensions for new features like reporting (21.4). All APIs use Express.js, JWT authentication, and follow REST principles.

## API Overview

- **Base URL:** `/api/v1`
- **Authentication:** JWT Bearer Token in Authorization header (required for all endpoints except public ones)
- **Error Format:** JSON with `error` and `message` fields, HTTP status codes
- **Rate Limiting:** Applied via middleware (100 requests/min per IP)
- **Pagination:** Default limit 20, offset-based for lists
- **Validation:** Input validation using Joi schemas
- **Documentation:** Swagger/OpenAPI at `/api-docs` (if enabled)

## Authentication & Authorization

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

**Roles:** owner, manager, tenant, contractor, admin
**Access Control:** Middleware checks user role and resource ownership

### Public Endpoints
- POST /auth/login - User authentication
- POST /auth/register - User registration (tenant self-signup)
- GET /auth/verify - Email verification

### Protected Endpoints Structure
- /properties - Property management
- /tenants - Tenant management
- /leases - Lease management
- /payments - Payment processing
- /maintenance - Maintenance requests
- /analytics - Analytics and insights
- /reports - Reporting endpoints (new for 21.4)

## Existing Endpoints

### Properties (/properties)
**GET /properties** - List user's properties
- Query: ?status=active&limit=20&offset=0
- Response: 200 { properties: [Property], total: number }
- Auth: owner/manager

**GET /properties/{id}** - Get specific property
- Response: 200 Property object
- Auth: owner/manager/tenant (if leased)

**POST /properties** - Create new property
- Body: Property creation data
- Response: 201 Created Property
- Auth: owner/manager

**PUT /properties/{id}** - Update property
- Body: Partial Property update
- Response: 200 Updated Property
- Auth: owner/manager

**DELETE /properties/{id}** - Soft delete property
- Response: 204 No Content
- Auth: owner

### Tenants (/tenants)
**GET /tenants** - List tenants
- Query: ?propertyId=uuid&status=active
- Response: 200 { tenants: [Tenant], total: number }
- Auth: owner/manager

**GET /tenants/{id}** - Get tenant details
- Response: 200 Tenant object with lease info
- Auth: owner/manager/tenant (self)

**POST /tenants** - Add tenant to property
- Body: { propertyId, tenantData }
- Response: 201 Created Tenant
- Auth: owner/manager

### Leases (/leases)
**GET /leases** - List leases
- Query: ?propertyId=uuid&status=active
- Response: 200 { leases: [Lease], total: number }
- Auth: owner/manager/tenant

**GET /leases/{id}** - Get lease details
- Response: 200 Lease with payments and tenants
- Auth: owner/manager/tenant

**POST /leases** - Create new lease
- Body: Lease creation data
- Response: 201 Created Lease
- Auth: owner/manager

**PUT /leases/{id}/renew** - Renew lease
- Body: Renewal terms
- Response: 200 Updated Lease
- Auth: owner/manager

### Payments (/payments)
**GET /payments** - List payments
- Query: ?leaseId=uuid&status=paid&dateFrom=YYYY-MM-DD
- Response: 200 { payments: [Payment], total: number }
- Auth: owner/manager/tenant

**POST /payments** - Process payment
- Body: { leaseId, amount, method }
- Response: 201 Created Payment with Stripe ID
- Auth: tenant (or owner for bulk)

**GET /payments/{id}** - Get payment details
- Response: 200 Payment with transaction info
- Auth: owner/manager/tenant

### Maintenance (/maintenance)
**GET /maintenance** - List maintenance requests
- Query: ?propertyId=uuid&status=pending
- Response: 200 { requests: [MaintenanceHistory], total: number }
- Auth: owner/manager/tenant/contractor

**POST /maintenance** - Create maintenance request
- Body: { propertyId, description, priority }
- Response: 201 Created Request
- Auth: tenant/manager

**PUT /maintenance/{id}** - Update request status
- Body: { status, notes, cost }
- Response: 200 Updated Request
- Auth: manager/contractor

**GET /maintenance/{id}** - Get request details
- Response: 200 Request with history
- Auth: owner/manager/tenant/contractor

### Analytics (/analytics)
**GET /analytics/metrics** - Get performance metrics
- Query: ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&propertyIds=uuid1,uuid2
- Response: 200 Metrics dashboard data
- Auth: owner/manager

**POST /analytics/predict-maintenance** - Predictive maintenance
- Body: { propertyId }
- Response: 200 Prediction results
- Auth: owner/manager

**POST /analytics/predict-churn** - Churn prediction
- Body: { tenantId }
- Response: 200 Churn risk assessment
- Auth: owner/manager

**GET /analytics/market-data** - Market trends [From 21.3]
- Query: ?zipCode=10001&propertyType=residential
- Response: 200 Market data
- Auth: owner/manager

**POST /analytics/pricing-recommendations** - Pricing suggestions [From 21.3]
- Body: { propertyId }
- Response: 200 Recommendations
- Auth: owner/manager

**POST /analytics/competitive-analysis** - Competitive positioning [From 21.3]
- Body: { propertyId }
- Response: 200 Analysis results
- Auth: owner/manager

**GET /analytics/market-trends** - Historical trends [From 21.3]
- Query: ?zipCode=10001&months=12
- Response: 200 Trend data
- Auth: owner/manager

## New Endpoints for Reporting (21.4)

### Report Management (/reports)
**POST /reports/generate** - Generate custom report
- Body: { templateId, parameters: { periodStart, periodEnd, properties } }
- Response: 200 { reportId, content, aiConfidence }
- Auth: owner/manager
- Rate Limit: 5/min

**GET /reports** - List user's reports
- Query: ?status=generated&limit=20&offset=0&dateFrom=YYYY-MM-DD
- Response: 200 { reports: [GeneratedReport], total: number }
- Auth: owner/manager

**GET /reports/{id}** - Retrieve specific report
- Response: 200 GeneratedReport with full content
- Auth: owner/manager (or shared access)

**POST /reports/{id}/export** - Export report
- Body: { format: 'pdf' | 'csv' | 'excel' }
- Response: 200 { fileUrl, downloadLink }
- Auth: owner/manager

**POST /reports/schedule** - Create report schedule
- Body: { templateId, frequency: 'monthly', recipients: [userIds], format: 'pdf' }
- Response: 201 ScheduledReport
- Auth: owner/manager

**GET /reports/scheduled** - List scheduled reports
- Response: 200 { schedules: [ScheduledReport] }
- Auth: owner/manager

**PUT /reports/schedule/{id}** - Update schedule
- Body: Partial schedule update
- Response: 200 Updated Schedule
- Auth: owner/manager

**DELETE /reports/schedule/{id}** - Delete schedule
- Response: 204 No Content
- Auth: owner/manager

### Report Templates (/reports/templates)
**POST /reports/templates** - Create custom template
- Body: { name, sections: [ { type, dataSource, visualization } ], isActive }
- Response: 201 Created Template
- Auth: owner/manager

**GET /reports/templates** - List templates
- Query: ?isActive=true&ownerId=uuid
- Response: 200 { templates: [ReportTemplate] }
- Auth: owner/manager

**GET /reports/templates/{id}** - Get template details
- Response: 200 ReportTemplate with sections
- Auth: owner/manager

**PUT /reports/templates/{id}** - Update template
- Body: Partial template update
- Response: 200 Updated Template
- Auth: owner

**DELETE /reports/templates/{id}** - Delete template
- Response: 204 No Content
- Auth: owner

## Error Handling Standards

All endpoints return consistent error format:
```json
{
  "error": "ValidationError",
  "message": "Zip code is required",
  "details": ["Zip code must be 5 digits"],
  "status": 400
}
```

**Common Status Codes:**
- 200 OK - Success
- 201 Created - Resource created
- 400 Bad Request - Validation error
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error

## Security Considerations

- **Authentication:** All endpoints require JWT (except auth/login)
- **Authorization:** Role-based access control (RBAC)
- **Input Validation:** Joi schemas for all request bodies/queries
- **Output Sanitization:** No sensitive data in responses
- **Rate Limiting:** Express-rate-limit middleware
- **CORS:** Restricted to frontend domains
- **HTTPS:** Enforced in production

## Performance Guidelines

- **Response Time:** < 500ms for simple queries, < 2s for complex analytics
- **Payload Size:** Max 10MB for requests/responses
- **Pagination:** Default 20 items, max 100
- **Caching:** Redis for frequently accessed data (analytics cache TTL: 1h)

## Reporting Extensions (21.4 Specific)

The new reporting endpoints follow existing patterns:
- All require authentication and role checks
- Use existing error handling middleware
- Integrate with analytics caching layer
- Support pagination for report lists
- Include audit logging for all report generations

**API Versioning:** All new endpoints under /api/v1/reports to maintain backward compatibility.

**Note:** This specification reflects current brownfield implementation. New reporting endpoints (21.4) extend existing patterns without breaking changes.