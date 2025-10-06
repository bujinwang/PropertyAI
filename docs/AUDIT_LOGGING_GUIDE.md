# Audit Logging System - Implementation Guide

## Overview

The PropertyFlow AI audit logging system is **fully implemented** and provides comprehensive tracking of all user actions, system events, and compliance-related activities across the platform.

## Architecture

### Backend Components

1. **Database Model** (`prisma/schema.prisma`)
   - `AuditEntry` model with comprehensive fields
   - Indexed for performance (userId, entityType, timestamp)
   - Supports compliance tracking and severity levels

2. **Service Layer** (`src/services/audit.service.ts`)
   - `AuditService` class with full CRUD operations
   - Methods for logging, querying, and analytics
   - Support for compliance actions and statistics

3. **API Endpoints** (`src/routes/auditRoutes.ts`)
   - `POST /api/audit/log` - Create audit log entry
   - `GET /api/audit/logs` - Get audit logs with filters
   - `GET /api/audit/trail/:entityType/:entityId` - Get entity audit trail
   - `GET /api/audit/stats` - Get audit statistics
   - `POST /api/audit/compliance` - Log compliance action

4. **Middleware** (`src/middleware/auditMiddleware.ts`)
   - Automatic request logging
   - Pre-configured middleware for common entities
   - Response capture capabilities

### Frontend Components

1. **Audit Utility** (`dashboard/src/utils/audit.ts`)
   - High-level audit logging functions
   - Automatic context capture (IP, user agent)
   - Entity-specific loggers (user, role, permission, invitation)

## Features

### ✅ Implemented Features

1. **User Action Logging**
   - Login/logout tracking
   - User CRUD operations
   - Password resets
   - Status changes

2. **Role & Permission Management**
   - Role creation/updates/deletion
   - Permission changes
   - Bulk permission updates

3. **Invitation Tracking**
   - Invitation sent/accepted/cancelled
   - Resend tracking
   - Expiration logging

4. **System Events**
   - API request logging
   - Error tracking
   - Compliance actions

5. **Query & Analytics**
   - Filtered log retrieval
   - Entity audit trails
   - Statistics by severity, action, entity type
   - Date range filtering

6. **Compliance Support**
   - GDPR/CCPA/HIPAA compliance types
   - Severity levels (INFO, WARNING, ERROR, CRITICAL)
   - Data retention policies
   - Automatic log cleanup

## Usage Examples

### Backend - Logging User Actions

```typescript
import { auditService } from '../services/audit.service';

// Manual logging
await auditService.logUserAction(
  req,
  'USER_UPDATE',
  'USER',
  userId,
  { changes: { email: 'new@email.com' } },
  'INFO'
);

// Using middleware
import { auditMiddlewares } from '../middleware/auditMiddleware';

// Apply to routes
router.put('/users/:id', 
  auditMiddlewares.user('UPDATE_USER'),
  userController.updateUser
);
```

### Backend - Compliance Logging

```typescript
await auditService.logComplianceAction(
  req,
  'DATA_EXPORT',
  'USER',
  userId,
  'GDPR',
  { reason: 'User data export request' }
);
```

### Backend - Querying Audit Logs

```typescript
// Get logs with filters
const result = await auditService.getAuditLogs({
  userId: 'user-123',
  entityType: 'PAYMENT',
  severity: 'WARNING',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50,
  offset: 0,
});

// Get entity audit trail
const trail = await auditService.getEntityAuditTrail(
  'PROPERTY',
  'property-456',
  100
);

// Get statistics
const stats = await auditService.getAuditStats({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

### Frontend - Audit Logging

```typescript
import { auditLogger } from '../utils/audit';

// User actions
await auditLogger.userCreated(adminId, newUserId, userData);
await auditLogger.userUpdated(adminId, userId, changes);
await auditLogger.userDeleted(adminId, userId);
await auditLogger.userLoggedIn(userId, ipAddress);

// Role actions
await auditLogger.roleCreated(adminId, roleId, roleData);
await auditLogger.rolePermissionsChanged(
  adminId, 
  roleId, 
  oldPermissions, 
  newPermissions
);

// Invitation actions
await auditLogger.invitationSent(adminId, invitationId, email, roleId);
await auditLogger.invitationAccepted(userId, invitationId);

// Bulk operations
await auditLogger.bulkUsersUpdated(
  adminId, 
  userIds, 
  'status_change', 
  { newStatus: 'active' }
);
```

## Database Schema

```prisma
model AuditEntry {
  id              String            @id @default(cuid())
  userId          String?
  action          String
  timestamp       DateTime          @default(now())
  details         Json?
  entityId        String
  entityType      String
  ipAddress       String?
  userAgent       String?
  sessionId       String?
  severity        AuditSeverity?    @default(INFO)
  complianceType  ComplianceType?
  User            User?             @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([action])
  @@index([severity])
}

enum AuditSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum ComplianceType {
  GDPR
  CCPA
  HIPAA
  SOC2
  PCI_DSS
}
```

## API Reference

### POST /api/audit/log

Create a new audit log entry.

**Request Body:**
```json
{
  "action": "USER_UPDATE",
  "entityType": "USER",
  "entityId": "user-123",
  "details": {
    "changes": {
      "email": "new@email.com"
    }
  },
  "severity": "INFO"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "audit-456",
    "userId": "user-789",
    "action": "USER_UPDATE",
    "entityType": "USER",
    "entityId": "user-123",
    "timestamp": "2024-01-06T10:30:00Z",
    "severity": "INFO",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### GET /api/audit/logs

Get audit logs with optional filters.

**Query Parameters:**
- `userId` - Filter by user ID
- `entityType` - Filter by entity type
- `entityId` - Filter by entity ID
- `action` - Filter by action (partial match)
- `severity` - Filter by severity
- `complianceType` - Filter by compliance type
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-123",
      "userId": "user-456",
      "action": "USER_LOGIN",
      "entityType": "USER",
      "entityId": "user-456",
      "timestamp": "2024-01-06T10:30:00Z",
      "severity": "INFO",
      "User": {
        "id": "user-456",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "total": 1523,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/audit/trail/:entityType/:entityId

Get complete audit trail for a specific entity.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-789",
      "userId": "user-123",
      "action": "PROPERTY_UPDATE",
      "entityType": "PROPERTY",
      "entityId": "property-456",
      "timestamp": "2024-01-06T10:30:00Z",
      "details": {
        "changes": {
          "price": 2500
        }
      },
      "User": {
        "id": "user-123",
        "email": "admin@example.com"
      }
    }
  ]
}
```

### GET /api/audit/stats

Get audit statistics.

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `userId` - Filter by user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 15234,
    "bySeverity": [
      { "severity": "INFO", "count": 12000 },
      { "severity": "WARNING", "count": 2500 },
      { "severity": "ERROR", "count": 650 },
      { "severity": "CRITICAL", "count": 84 }
    ],
    "topActions": [
      { "action": "USER_LOGIN", "count": 3456 },
      { "action": "PROPERTY_VIEW", "count": 2341 },
      { "action": "PAYMENT_PROCESSED", "count": 1876 }
    ],
    "topEntityTypes": [
      { "entityType": "USER", "count": 5678 },
      { "entityType": "PROPERTY", "count": 4321 },
      { "entityType": "PAYMENT", "count": 3456 }
    ]
  }
}
```

## Security Considerations

1. **Authentication Required**: All audit endpoints require valid JWT token
2. **Authorization**: Only admins should access audit logs
3. **Sensitive Data**: Avoid logging passwords, tokens, or sensitive PII
4. **Retention**: Implement data retention policies based on compliance requirements
5. **Immutability**: Audit logs should never be modified or deleted (except for retention policies)

## Performance Optimization

1. **Database Indexes**: 
   - Indexed on userId, entityType, entityId, timestamp, action, severity
   - Composite indexes for common query patterns

2. **Pagination**: 
   - Default limit of 50 records
   - Offset-based pagination for large datasets

3. **Async Logging**: 
   - Audit logging doesn't block main request flow
   - Errors in audit logging don't fail the primary operation

4. **Cleanup**: 
   - Use `deleteOldLogs(days)` method for retention policies
   - Schedule periodic cleanup jobs

## Best Practices

1. **Consistent Action Names**: Use uppercase with underscores (e.g., `USER_LOGIN`, `PAYMENT_PROCESSED`)
2. **Meaningful Details**: Include relevant context without sensitive data
3. **Appropriate Severity**: 
   - `INFO` - Normal operations
   - `WARNING` - Important actions (payments, deletions)
   - `ERROR` - Failed operations
   - `CRITICAL` - Security events, compliance violations

4. **Entity Types**: Use consistent naming (USER, PROPERTY, PAYMENT, etc.)
5. **Error Handling**: Never let audit logging fail the main operation

## Compliance Features

The audit system supports multiple compliance frameworks:

- **GDPR**: Data access, export, deletion tracking
- **CCPA**: California privacy rights tracking
- **HIPAA**: Healthcare data access logging
- **SOC 2**: Security controls audit trail
- **PCI DSS**: Payment card industry compliance

## Testing

The audit system is production-ready and has been:
- ✅ Fully implemented in backend
- ✅ Integrated with authentication middleware
- ✅ Connected to frontend utilities
- ✅ Database schema created and migrated
- ✅ API endpoints exposed and secured

## Future Enhancements

Potential future additions:
- Real-time audit log streaming
- Advanced analytics and anomaly detection
- Integration with SIEM systems
- Encrypted audit log storage
- Blockchain-based audit trail for critical operations

## Support

For questions or issues with the audit logging system:
- Review this documentation
- Check backend logs for errors
- Verify authentication is working
- Ensure database migrations are up to date

---

**Last Updated**: 2024-01-06  
**Version**: 1.0  
**Status**: Production Ready ✅
