
# API Migration Guide: Properties & Units → Rentals

## Overview
We are consolidating the Properties and Units APIs into a unified Rentals API for better consistency and maintainability.

## Timeline
- **Deprecation Date**: February 1, 2024
- **Removal Date**: May 1, 2024
- **Migration Period**: 3 months

## Breaking Changes

### 1. Endpoint Changes

#### Properties API → Rentals API
| Legacy Endpoint | New Endpoint | Notes |
|----------------|--------------|-------|
| `GET /api/properties` | `GET /api/rentals` | Same functionality |
| `GET /api/properties/:id` | `GET /api/rentals/:id` | Same functionality |
| `POST /api/properties` | `POST /api/rentals` | See schema changes below |
| `PUT /api/properties/:id` | `PUT /api/rentals/:id` | See schema changes below |
| `DELETE /api/properties/:id` | `DELETE /api/rentals/:id` | Same functionality |

#### Units API → Rentals API
| Legacy Endpoint | New Endpoint | Notes |
|----------------|--------------|-------|
| `GET /api/units` | `GET /api/rentals?type=unit` | Filter by type |
| `GET /api/units/:id` | `GET /api/rentals/:id` | Same functionality |
| `GET /api/properties/:id/units` | `GET /api/rentals/:id/units` | Parent-child relationship |
| `POST /api/properties/:id/units` | `POST /api/rentals` | Set `parentRentalId` |
| `PUT /api/units/:id` | `PUT /api/rentals/:id` | Same functionality |
| `DELETE /api/units/:id` | `DELETE /api/rentals/:id` | Same functionality |

### 2. Schema Changes

#### New Fields in Rental Model
- `type`: RentalType enum (HOUSE, APARTMENT, CONDO, TOWNHOUSE, STUDIO, OTHER)
- `parentRentalId`: For unit relationships
- `legacyPropertyId`: Reference to original property
- `legacyUnitId`: Reference to original unit

#### Removed Fields
- Property-specific fields are now unified in the rental model
- Unit-specific fields are now part of the rental model

### 3. Response Format Changes

#### Before (Properties)
```json
{
  "id": "prop_123",
  "name": "Sunset Apartments",
  "address": "123 Main St",
  "units": [...]
}
```

#### After (Rentals)
```json
{
  "id": "rental_456",
  "title": "Sunset Apartments",
  "type": "APARTMENT",
  "address": "123 Main St",
  "childRentals": [...],
  "legacyPropertyId": "prop_123"
}
```

## Migration Steps

### 1. Update API Calls
Replace all property and unit API calls with rental API calls according to the mapping table above.

### 2. Update Request/Response Handling
- Update field names (`name` → `title`)
- Handle new `type` field
- Update relationship handling (`units` → `childRentals`)

### 3. Update Database Queries
If you're directly querying the database:
- Use `rental` table instead of `property` and `unit` tables
- Update foreign key references
- Use `parentRentalId` for unit relationships

### 4. Testing
- Test all API integrations with new endpoints
- Verify data migration completed successfully
- Test backward compatibility during transition period

## Code Examples

### Before (Legacy)
```javascript
// Get all properties
const properties = await fetch('/api/properties');

// Get property units
const units = await fetch('/api/properties/123/units');

// Create new unit
await fetch('/api/properties/123/units', {
  method: 'POST',
  body: JSON.stringify(unitData)
});
```

### After (New)
```javascript
// Get all rentals (properties)
const rentals = await fetch('/api/rentals');

// Get rental units
const units = await fetch('/api/rentals/123/units');

// Create new unit
await fetch('/api/rentals', {
  method: 'POST',
  body: JSON.stringify({
    ...unitData,
    parentRentalId: '123'
  })
});
```

## Support

During the migration period:
- Legacy endpoints will continue to work with deprecation warnings
- New endpoints are available immediately
- Contact support for migration assistance

## Deprecation Warnings

Legacy endpoints will return deprecation headers:
- `X-API-Deprecated: true`
- `X-API-Removal-Date: 2024-05-01`
- `X-API-New-Path: /api/rentals`

Response bodies will include deprecation notices in the `_deprecation` field.
