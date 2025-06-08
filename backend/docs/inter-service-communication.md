# Inter-Service Communication in PropertyAI

This document outlines the implementation of inter-service communication between microservices in the PropertyAI application.

## Overview

PropertyAI uses a RESTful HTTP-based approach for inter-service communication. Services can make requests to other services to validate data, retrieve information, or trigger actions while maintaining loose coupling.

## Implementation Details

### Service Communication Utility

The central component of our inter-service communication is the `ServiceCommunication` class located in `backend/src/utils/serviceUtils.ts`. This utility provides:

- A standardized way to make HTTP calls between services
- Error handling and reporting
- Authentication for internal service calls
- Helper methods for common operations

### Internal API Endpoints

Each microservice exposes internal endpoints that can be called by other services:

#### Users Service
- `/api/users/validate/:id` - Validate if a user exists and is active
- `/api/users/basic/:id` - Get basic user information

#### Properties Service
- `/api/properties/validate/:id` - Validate if a property exists and is active
- `/api/properties/basic/:id` - Get basic property information

### Security

All inter-service communication includes a special header `X-Internal-Service-Call: true` which is validated by the receiving service. This helps ensure that these internal endpoints cannot be accessed directly by external clients.

## Usage Examples

### Example 1: Validating Related Entities

When creating a maintenance request, the service validates both the property and the user:

```typescript
// Validate the property
const property = await ServiceCommunication.validateProperty(propertyId);
if (!property.isActive) {
  throw new Error('Property is not active');
}

// Validate the user
const user = await ServiceCommunication.validateUser(userId);
if (!user.isActive) {
  throw new Error('User account is not active');
}
```

### Example 2: Combining Data from Multiple Services

When retrieving a maintenance request, we fetch additional details from other services:

```typescript
// Get the base maintenance request
const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
  where: { id },
  include: { ... }
});

// Get property details from the Properties service
const propertyDetails = await ServiceCommunication.getPropertyBasicInfo(
  maintenanceRequest.property.id
);

// Get user details from the Users service
const requestedBy = await ServiceCommunication.getUserBasicInfo(
  maintenanceRequest.requestedById
);

// Combine the data
return {
  ...maintenanceRequest,
  property: {
    ...maintenanceRequest.property,
    ...propertyDetails
  },
  requestedBy
};
```

## Configuration

The base URL for service communication is configured in `config.ts`:

```typescript
services: {
  baseUrl: process.env.SERVICES_BASE_URL || 'http://localhost:5000/api',
  requestTimeout: parseInt(process.env.SERVICES_REQUEST_TIMEOUT || '5000'),
},
```

In production, this would be set to the service discovery endpoint or load balancer.

## Error Handling

The `ServiceCommunication` class includes built-in error handling that adds context about which service failed and why. Services should use try/catch blocks to handle these errors appropriately.

## Future Improvements

- Add circuit breaker pattern to handle service outages gracefully
- Implement message queue for asynchronous communication when appropriate
- Add distributed tracing for better debugging of cross-service calls
- Add caching for frequently accessed data to reduce cross-service calls 