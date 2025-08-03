# Rental Model Consolidation Migration Guide

## Overview
This migration consolidates the `Property`, `Unit`, and `Listing` models into a single `Rental` model while maintaining all existing functionality and data integrity.

## Migration Strategy
The migration follows a staged approach:
1. **Schema Creation**: Create new `Rental` and `RentalImage` tables
2. **Data Migration**: Migrate data from existing tables to new structure
3. **Relationship Updates**: Update all foreign key relationships
4. **Validation**: Verify data integrity and relationships
5. **Cleanup**: Remove old tables (in future migration)

## Pre-Migration Checklist
- [ ] Backup database
- [ ] Ensure no active transactions
- [ ] Verify application is in maintenance mode
- [ ] Check disk space for potential data duplication

## Migration Steps

### Step 1: Execute Schema Migration
```bash
cd backend
psql -d propertyai -f prisma/migrations/20250802_consolidate_to_rental/migration.sql
```

### Step 2: Execute Data Migration
```bash
psql -d propertyai -f prisma/migrations/20250802_consolidate_to_rental/data_migration.sql
```

### Step 3: Update Prisma Schema
After migration, update `schema.prisma` to include the new Rental model and remove old models.

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

## Data Mapping Strategy

### Property → Rental
| Property Field | Rental Field | Notes |
|----------------|--------------|--------|
| `id` | `id` | Direct mapping |
| `name` | `title` | Property name becomes rental title |
| `description` | `description` | Direct mapping |
| `address` | `address` | Direct mapping |
| `city` | `city` | Direct mapping |
| `state` | `state` | Direct mapping |
| `zipCode` | `zipCode` | Direct mapping |
| `country` | `country` | Direct mapping |
| `latitude` | `latitude` | Direct mapping |
| `longitude` | `longitude` | Direct mapping |
| `propertyType` | `propertyType` | Direct mapping |
| `yearBuilt` | `yearBuilt` | Direct mapping |
| `totalUnits` | `totalUnits` | Direct mapping |
| `amenities` | `amenities` | Direct mapping |
| `isActive` | `isActive` | Direct mapping |
| `managerId` | `managerId` | Direct mapping |
| `ownerId` | `ownerId` | Direct mapping |
| `whiteLabelConfigId` | `whiteLabelConfigId` | Direct mapping |
| `createdAt` | `createdAt` | Direct mapping |
| `updatedAt` | `updatedAt` | Direct mapping |

### Unit → Rental
| Unit Field | Rental Field | Notes |
|------------|--------------|--------|
| `unitNumber` | `unitNumber` | Direct mapping |
| `floorNumber` | `floorNumber` | Direct mapping |
| `size` | `size` | Direct mapping |
| `bedrooms` | `bedrooms` | Direct mapping |
| `bathrooms` | `bathrooms` | Direct mapping |
| `rent` | `rent` | Direct mapping |
| `deposit` | `deposit` | Direct mapping |
| `isAvailable` | `isAvailable` | Direct mapping |
| `dateAvailable` | `availableDate` | Direct mapping |
| `features` | `amenities` | Merged with property amenities |

### Listing → Rental
| Listing Field | Rental Field | Notes |
|---------------|--------------|--------|
| `id` | `id` | Direct mapping |
| `title` | `title` | Listing title overrides property name |
| `description` | `description` | Listing description overrides property description |
| `status` | `status` | Direct mapping |
| `slug` | `slug` | Direct mapping |
| `leaseTerms` | `leaseTerms` | Direct mapping |
| `rent` | `rent` | Listing rent overrides unit rent |
| `availableDate` | `availableDate` | Listing date overrides unit date |
| `createdById` | `createdById` | Direct mapping |
| `isActive` | `isActive` | Direct mapping |
| `viewCount` | `viewCount` | Direct mapping |
| `createdAt` | `createdAt` | Direct mapping |
| `updatedAt` | `updatedAt` | Direct mapping |

## Migration Types

### 1. Property-Only Rentals
- Properties without units or listings
- Maps directly to Rental with basic property information
- Default values for unit-specific fields

### 2. Property+Unit Rentals
- Properties with units but no listings
- Combines property and unit information
- Uses unit-specific data where available

### 3. Full Consolidation
- Properties with both units and listings
- Combines all three models
- Listing data takes precedence for marketing fields

## Relationship Updates

### Updated Models
The following models now reference `Rental` instead of `Property`/`Unit`/`Listing`:

- `Appliance` → references `Rental`
- `Application` → references `Rental`
- `BusinessHours` → references `Rental`
- `Document` → references `Rental`
- `EmergencyProtocol` → references `Rental`
- `EscalationPolicy` → references `Rental`
- `Lease` → references `Rental`
- `MaintenanceRequest` → references `Rental`
- `OnCallSchedule` → references `Rental`
- `PredictiveMaintenance` → references `Rental`
- `WhiteLabelConfig` → references `Rental`

### User Model Enhancements
Added array fields to track rental relationships:
- `rentalsManaged`: Array of rental IDs managed by user
- `rentalsOwned`: Array of rental IDs owned by user
- `rentals`: Array of rental IDs for tenant relationships

## Image Migration

### Property Images → Rental Images
- Property images are migrated to `RentalImage`
- Maintains original metadata (filename, size, etc.)
- Preserves featured image status

### Unit Images → Rental Images
- Unit images are migrated to `RentalImage`
- Maintains original metadata
- Preserves featured image status

## Validation Queries

### Verify Rental Count
```sql
SELECT COUNT(*) as total_rentals FROM "Rental";
```

### Verify Migration Mapping
```sql
SELECT 
    migration_type,
    COUNT(*) as count
FROM rental_migration_mapping
GROUP BY migration_type;
```

### Verify Foreign Key Relationships
```sql
SELECT 
    'Appliance' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Appliance" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'Application' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Application" WHERE "rentalId" IS NOT NULL
-- Add similar queries for other tables
```

### Verify Image Migration
```sql
SELECT COUNT(*) as total_rental_images FROM "RentalImage";
```

## Rollback Procedure

If migration fails or needs to be reverted:

```bash
psql -d propertyai -f prisma/migrations/20250802_consolidate_to_rental/rollback.sql
```

## Post-Migration Steps

### 1. Update Application Code
- Update services to use new Rental model
- Update controllers and API endpoints
- Update frontend components

### 2. Update Tests
- Update test fixtures and factories
- Update integration tests
- Update unit tests

### 3. Update Documentation
- Update API documentation
- Update database schema documentation
- Update user guides

### 4. Performance Optimization
- Monitor query performance
- Add additional indexes if needed
- Optimize complex queries

## Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Errors
- Ensure data migration runs after schema migration
- Check for orphaned records
- Verify referential integrity

#### 2. Data Loss
- Always backup before migration
- Use transaction rollback if issues occur
- Verify data counts match pre-migration

#### 3. Performance Issues
- Add appropriate indexes
- Consider batch processing for large datasets
- Monitor database performance during migration

### Debug Queries

#### Check Migration Progress
```sql
SELECT 
    'Rental' as table_name,
    COUNT(*) as record_count
FROM "Rental"
UNION ALL
SELECT 
    'RentalImage' as table_name,
    COUNT(*) as record_count
FROM "RentalImage";
```

#### Check Orphaned Records
```sql
SELECT COUNT(*) as orphaned_appliances
FROM "Appliance" WHERE "rentalId" IS NULL AND "unitId" IS NOT NULL;
```

## Future Considerations

### Phase 2: Remove Old Tables
After successful migration and validation:
1. Remove Property, Unit, and Listing tables
2. Remove old foreign key columns
3. Update Prisma schema to remove old models

### Phase 3: Optimization
1. Add additional indexes based on query patterns
2. Implement database partitioning if needed
3. Add materialized views for complex queries

## Support
For issues or questions during migration:
- Check migration logs
- Verify data integrity with provided queries
- Use rollback procedure if needed
- Contact development team for assistance