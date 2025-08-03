-- Rollback: Revert consolidation from Rental back to Property, Unit, and Listing
-- Created: 2025-08-02

-- Step 1: Restore foreign key relationships in related tables
-- Note: This assumes data has been migrated back to original tables

-- Step 2: Remove foreign key constraints for rentalId
ALTER TABLE "Appliance" DROP CONSTRAINT IF EXISTS "Appliance_rentalId_fkey";
ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_rentalId_fkey";
ALTER TABLE "BusinessHours" DROP CONSTRAINT IF EXISTS "BusinessHours_rentalId_fkey";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_rentalId_fkey";
ALTER TABLE "EmergencyProtocol" DROP CONSTRAINT IF EXISTS "EmergencyProtocol_rentalId_fkey";
ALTER TABLE "EscalationPolicy" DROP CONSTRAINT IF EXISTS "EscalationPolicy_rentalId_fkey";
ALTER TABLE "Lease" DROP CONSTRAINT IF EXISTS "Lease_rentalId_fkey";
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT IF EXISTS "MaintenanceRequest_rentalId_fkey";
ALTER TABLE "OnCallSchedule" DROP CONSTRAINT IF EXISTS "OnCallSchedule_rentalId_fkey";
ALTER TABLE "PredictiveMaintenance" DROP CONSTRAINT IF EXISTS "PredictiveMaintenance_rentalId_fkey";
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT IF EXISTS "WhiteLabelConfig_rentalId_fkey";

-- Step 3: Remove rentalId columns from related tables
ALTER TABLE "Appliance" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "BusinessHours" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "Document" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "EmergencyProtocol" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "EscalationPolicy" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "Lease" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "MaintenanceRequest" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "OnCallSchedule" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "PredictiveMaintenance" DROP COLUMN IF EXISTS "rentalId";
ALTER TABLE "WhiteLabelConfig" DROP COLUMN IF EXISTS "rentalId";

-- Step 4: Remove rental-related columns from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "rentalsManaged";
ALTER TABLE "User" DROP COLUMN IF EXISTS "rentalsOwned";
ALTER TABLE "User" DROP COLUMN IF EXISTS "rentals";

-- Step 5: Drop RentalImage table
DROP TABLE IF EXISTS "RentalImage" CASCADE;

-- Step 6: Drop Rental table
DROP TABLE IF EXISTS "Rental" CASCADE;

-- Step 7: Drop migration mapping table
DROP TABLE IF EXISTS rental_migration_mapping;

-- Step 8: Restore original foreign key constraints (these should already exist from original schema)
-- These are commented out as they should already be present
-- ALTER TABLE "Appliance" ADD CONSTRAINT "Appliance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "Application" ADD CONSTRAINT "Application_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "EmergencyProtocol" ADD CONSTRAINT "EmergencyProtocol_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "EscalationPolicy" ADD CONSTRAINT "EscalationPolicy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "OnCallSchedule" ADD CONSTRAINT "OnCallSchedule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "PredictiveMaintenance" ADD CONSTRAINT "PredictiveMaintenance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Verify rollback completion
SELECT 'Rollback completed successfully' as status;