-- Data Migration: Consolidate Property, Unit, and Listing into Rental
-- Created: 2025-08-02

-- Step 1: Create mapping table for tracking migration (drop if exists)
DROP TABLE IF EXISTS rental_migration_mapping;
CREATE TABLE rental_migration_mapping (
    id SERIAL PRIMARY KEY,
    property_id TEXT,
    unit_id TEXT,
    listing_id TEXT,
    rental_id TEXT,
    migration_type VARCHAR(20), -- 'property_only', 'property_unit', 'property_unit_listing'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert Property-only rentals (properties without units or listings)
INSERT INTO "Rental" (
    id, title, description, address, city, state, "zipCode", country,
    latitude, longitude, "propertyType", "yearBuilt", "totalUnits", amenities,
    rent, deposit, "isAvailable", slug, "isActive", status, "managerId", "ownerId",
    "createdById", "whiteLabelConfigId", "createdAt", "updatedAt"
)
SELECT 
    p.id,
    p.name as title,
    p.description,
    p.address,
    p.city,
    p.state,
    p."zipCode",
    p.country,
    p.latitude,
    p.longitude,
    p."propertyType",
    p."yearBuilt",
    p."totalUnits",
    p.amenities,
    0.0 as rent, -- Default rent for property-only
    0.0 as deposit, -- Default deposit for property-only
    true as "isAvailable",
    LOWER(REPLACE(p.name, ' ', '-')) || '-' || LEFT(p.id, 8) as slug,
    p."isActive",
    'ACTIVE'::"ListingStatus" as status,
    p."managerId",
    p."ownerId",
    p."managerId" as "createdById",
    p."whiteLabelConfigId",
    p."createdAt",
    p."updatedAt"
FROM "Property" p
WHERE NOT EXISTS (
    SELECT 1 FROM "Unit" u WHERE u."propertyId" = p.id
)
AND NOT EXISTS (
    SELECT 1 FROM "Listing" l WHERE l."propertyId" = p.id
);

-- Record property-only mappings
INSERT INTO rental_migration_mapping (property_id, rental_id, migration_type)
SELECT p.id, p.id, 'property_only'
FROM "Property" p
WHERE NOT EXISTS (
    SELECT 1 FROM "Unit" u WHERE u."propertyId" = p.id
)
AND NOT EXISTS (
    SELECT 1 FROM "Listing" l WHERE l."propertyId" = p.id
);

-- Step 3: Insert Property+Unit rentals (properties with units but no listings)
INSERT INTO "Rental" (
    id, title, description, address, city, state, "zipCode", country,
    latitude, longitude, "propertyType", "yearBuilt", "totalUnits", amenities,
    "unitNumber", "floorNumber", size, bedrooms, bathrooms, rent, deposit,
    "availableDate", "isAvailable", slug, "isActive", status, "managerId", "ownerId",
    "createdById", "whiteLabelConfigId", "createdAt", "updatedAt"
)
SELECT 
    u.id,
    SUBSTRING(p.name || ' - Unit ' || u."unitNumber", 1, 255) as title,
    COALESCE(u.features->>'description', p.description) as description,
    p.address,
    p.city,
    p.state,
    p."zipCode",
    p.country,
    p.latitude,
    p.longitude,
    p."propertyType",
    p."yearBuilt",
    1 as "totalUnits",
    p.amenities,
    u."unitNumber",
    u."floorNumber",
    u.size,
    u.bedrooms,
    u.bathrooms,
    COALESCE(u.rent, 0.0) as rent,
    u.deposit,
    u."dateAvailable" as "availableDate",
    u."isAvailable",
    SUBSTRING(LOWER(REPLACE(p.name, ' ', '-')) || '-unit-' || u."unitNumber" || '-' || LEFT(u.id, 8), 1, 255) as slug,
    p."isActive",
    CASE WHEN u."isAvailable" THEN 'ACTIVE'::"ListingStatus" ELSE 'ARCHIVED'::"ListingStatus" END as status,
    p."managerId",
    p."ownerId",
    p."managerId" as "createdById",
    p."whiteLabelConfigId",
    u."createdAt",
    u."updatedAt"
FROM "Unit" u
JOIN "Property" p ON p.id = u."propertyId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Listing" l WHERE l."unitId" = u.id
);

-- Record property+unit mappings
INSERT INTO rental_migration_mapping (property_id, unit_id, rental_id, migration_type)
SELECT p.id, u.id, u.id, 'property_unit'
FROM "Unit" u
JOIN "Property" p ON p.id = u."propertyId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Listing" l WHERE l."unitId" = u.id
);

-- Step 4: Insert Property+Unit+Listing rentals (full consolidation)
INSERT INTO "Rental" (
    id, title, description, address, city, state, "zipCode", country,
    latitude, longitude, "propertyType", "yearBuilt", "totalUnits", amenities,
    "unitNumber", "floorNumber", size, bedrooms, bathrooms, rent, deposit,
    "availableDate", "isAvailable", "leaseTerms", slug, "viewCount", "isActive",
    status, "managerId", "ownerId", "createdById", "whiteLabelConfigId", "createdAt", "updatedAt"
)
SELECT 
    l.id,
    SUBSTRING(l.title, 1, 255) as title,
    SUBSTRING(l.description, 1, 1000) as description,
    p.address,
    p.city,
    p.state,
    p."zipCode",
    p.country,
    p.latitude,
    p.longitude,
    p."propertyType",
    p."yearBuilt",
    1 as "totalUnits",
    p.amenities,
    u."unitNumber",
    u."floorNumber",
    u.size,
    u.bedrooms,
    u.bathrooms,
    l.rent,
    u.deposit,
    l."availableDate",
    l."isActive" as "isAvailable",
    l."leaseTerms",
    SUBSTRING(l.slug, 1, 255) as slug,
    l."viewCount",
    p."isActive",
    l.status,
    p."managerId",
    p."ownerId",
    l."createdById",
    p."whiteLabelConfigId",
    l."createdAt",
    l."updatedAt"
FROM "Listing" l
JOIN "Property" p ON p.id = l."propertyId"
LEFT JOIN "Unit" u ON u.id = l."unitId";

-- Record full consolidation mappings
INSERT INTO rental_migration_mapping (property_id, unit_id, listing_id, rental_id, migration_type)
SELECT p.id, u.id, l.id, l.id, 'property_unit_listing'
FROM "Listing" l
JOIN "Property" p ON p.id = l."propertyId"
LEFT JOIN "Unit" u ON u.id = l."unitId";

-- Step 5: Update foreign key references in related tables
-- Update Appliance table
UPDATE "Appliance" a
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.unit_id = a."unitId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.unit_id = a."unitId"
);

-- Update Application table
UPDATE "Application" a
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.listing_id = a."listingId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.listing_id = a."listingId"
);

-- Update BusinessHours table
UPDATE "BusinessHours" bh
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = bh."propertyId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.property_id = bh."propertyId"
);

-- Update Document table
UPDATE "Document" d
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = d."propertyId"
)
WHERE d."propertyId" IS NOT NULL;

-- Update EmergencyProtocol table
UPDATE "EmergencyProtocol" ep
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = ep."propertyId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.property_id = ep."propertyId"
);

-- Update EscalationPolicy table
UPDATE "EscalationPolicy" ep
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = ep."propertyId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.property_id = ep."propertyId"
);

-- Update Lease table
UPDATE "Lease" l
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.unit_id = l."unitId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.unit_id = l."unitId"
);

-- Update MaintenanceRequest table
UPDATE "MaintenanceRequest" mr
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = mr."propertyId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.property_id = mr."propertyId"
);

-- Update OnCallSchedule table
UPDATE "OnCallSchedule" ocs
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.property_id = ocs."propertyId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.property_id = ocs."propertyId"
);

-- Update PredictiveMaintenance table
UPDATE "PredictiveMaintenance" pm
SET "rentalId" = (
    SELECT rm.rental_id 
    FROM rental_migration_mapping rm 
    WHERE rm.unit_id = pm."unitId"
)
WHERE EXISTS (
    SELECT 1 FROM rental_migration_mapping rm 
    WHERE rm.unit_id = pm."unitId"
);

-- Step 6: Migrate images from PropertyImage and UnitImage to RentalImage
-- Property images for property-only rentals
INSERT INTO "RentalImage" (
    "rentalId", filename, "originalFilename", mimetype, size, url, "isFeatured", "createdAt", "updatedAt"
)
SELECT 
    rm.rental_id,
    pi.filename,
    pi."originalFilename",
    pi.mimetype,
    pi.size,
    pi.url,
    pi."isFeatured",
    pi."createdAt",
    pi."updatedAt"
FROM "PropertyImage" pi
JOIN rental_migration_mapping rm ON rm.property_id = pi."propertyId"
WHERE rm.migration_type = 'property_only';

-- Unit images for property+unit rentals
INSERT INTO "RentalImage" (
    "rentalId", filename, "originalFilename", mimetype, size, url, "isFeatured", "createdAt", "updatedAt"
)
SELECT 
    rm.rental_id,
    ui.filename,
    ui."originalFilename",
    ui.mimetype,
    ui.size,
    ui.url,
    ui."isFeatured",
    ui."createdAt",
    ui."updatedAt"
FROM "UnitImage" ui
JOIN rental_migration_mapping rm ON rm.unit_id = ui."unitId"
WHERE rm.migration_type IN ('property_unit', 'property_unit_listing');

-- Step 7: Update User model relationships
-- Drop columns if they exist
ALTER TABLE "User" 
DROP COLUMN IF EXISTS "rentalsManaged",
DROP COLUMN IF EXISTS "rentalsOwned",
DROP COLUMN IF EXISTS "rentals";

-- Add rental-related columns to User
ALTER TABLE "User" 
ADD COLUMN "rentalsManaged" TEXT[] DEFAULT '{}',
ADD COLUMN "rentalsOwned" TEXT[] DEFAULT '{}',
ADD COLUMN "rentals" TEXT[] DEFAULT '{}';

-- Populate rentalsManaged
UPDATE "User" u
SET "rentalsManaged" = (
    SELECT ARRAY_AGG(r.id)
    FROM "Rental" r
    WHERE r."managerId" = u.id
)
WHERE EXISTS (
    SELECT 1 FROM "Rental" r WHERE r."managerId" = u.id
);

-- Populate rentalsOwned
UPDATE "User" u
SET "rentalsOwned" = (
    SELECT ARRAY_AGG(r.id)
    FROM "Rental" r
    WHERE r."ownerId" = u.id
)
WHERE EXISTS (
    SELECT 1 FROM "Rental" r WHERE r."ownerId" = u.id
);

-- Step 8: Verification queries
-- Count total rentals created
SELECT 'Total rentals created: ' || COUNT(*) FROM "Rental";

-- Count by migration type
SELECT 
    migration_type,
    COUNT(*) as count
FROM rental_migration_mapping
GROUP BY migration_type
ORDER BY count DESC;

-- Verify foreign key relationships
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

-- Verify image migration
SELECT 'Rental images created: ' || COUNT(*) FROM "RentalImage";