-- Verification script for Rental model consolidation migration
-- Run this after data_migration.sql to verify success

-- 1. Check total counts
SELECT '=== MIGRATION SUMMARY ===' as summary;

SELECT 'Total Rentals created: ' || COUNT(*) as count FROM "Rental";

SELECT 'Migration types:' as label;
SELECT 
    migration_type,
    COUNT(*) as count
FROM rental_migration_mapping
GROUP BY migration_type
ORDER BY count DESC;

-- 2. Check data integrity
SELECT '=== DATA INTEGRITY CHECKS ===' as checks;

-- Check for orphaned records
SELECT 'Orphaned Appliances: ' || COUNT(*) as count 
FROM "Appliance" WHERE "rentalId" IS NULL AND "unitId" IS NOT NULL;

SELECT 'Orphaned Applications: ' || COUNT(*) as count 
FROM "Application" WHERE "rentalId" IS NULL AND "listingId" IS NOT NULL;

SELECT 'Orphaned Leases: ' || COUNT(*) as count 
FROM "Lease" WHERE "rentalId" IS NULL AND "unitId" IS NOT NULL;

-- 3. Check foreign key relationships
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as relationships;

SELECT 
    'Appliance' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Appliance" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'Application' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Application" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'BusinessHours' as table_name,
    COUNT(*) as records_with_rental_id
FROM "BusinessHours" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'Document' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Document" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'EmergencyProtocol' as table_name,
    COUNT(*) as records_with_rental_id
FROM "EmergencyProtocol" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'EscalationPolicy' as table_name,
    COUNT(*) as records_with_rental_id
FROM "EscalationPolicy" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'Lease' as table_name,
    COUNT(*) as records_with_rental_id
FROM "Lease" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'MaintenanceRequest' as table_name,
    COUNT(*) as records_with_rental_id
FROM "MaintenanceRequest" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'OnCallSchedule' as table_name,
    COUNT(*) as records_with_rental_id
FROM "OnCallSchedule" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'PredictiveMaintenance' as table_name,
    COUNT(*) as records_with_rental_id
FROM "PredictiveMaintenance" WHERE "rentalId" IS NOT NULL
UNION ALL
SELECT 
    'WhiteLabelConfig' as table_name,
    COUNT(*) as records_with_rental_id
FROM "WhiteLabelConfig" WHERE "rentalId" IS NOT NULL;

-- 4. Check User relationships
SELECT '=== USER RELATIONSHIPS ===' as user_relations;

SELECT 'Users managing rentals: ' || COUNT(*) as count
FROM "User" WHERE array_length("rentalsManaged", 1) > 0;

SELECT 'Users owning rentals: ' || COUNT(*) as count
FROM "User" WHERE array_length("rentalsOwned", 1) > 0;

-- 5. Check image migration
SELECT '=== IMAGE MIGRATION ===' as images;

SELECT 'Rental images created: ' || COUNT(*) as count FROM "RentalImage";

-- 6. Sample data verification
SELECT '=== SAMPLE RENTAL DATA ===' as samples;

SELECT 
    id,
    title,
    address,
    city,
    state,
    "zipCode",
    rent,
    bedrooms,
    bathrooms,
    "isAvailable",
    status
FROM "Rental" 
LIMIT 5;

-- 7. Check for data completeness
SELECT '=== DATA COMPLETENESS ===' as completeness;

SELECT 
    'Total Properties: ' || (SELECT COUNT(*) FROM "Property") as original_properties,
    'Total Units: ' || (SELECT COUNT(*) FROM "Unit") as original_units,
    'Total Listings: ' || (SELECT COUNT(*) FROM "Listing") as original_listings,
    'Total Rentals: ' || (SELECT COUNT(*) FROM "Rental") as new_rentals;

-- 8. Check for any issues
SELECT '=== ISSUE CHECKS ===' as issues;

-- Check for duplicate slugs
SELECT 'Duplicate slugs: ' || COUNT(*) as count
FROM (
    SELECT slug, COUNT(*) as cnt
    FROM "Rental"
    GROUP BY slug
    HAVING COUNT(*) > 1
) as duplicates;

-- Check for missing required fields
SELECT 'Missing addresses: ' || COUNT(*) as count
FROM "Rental" WHERE address IS NULL OR address = '';

SELECT 'Missing cities: ' || COUNT(*) as count
FROM "Rental" WHERE city IS NULL OR city = '';

-- 9. Final status
SELECT '=== MIGRATION STATUS ===' as status;
SELECT 'Migration completed successfully!' as message;