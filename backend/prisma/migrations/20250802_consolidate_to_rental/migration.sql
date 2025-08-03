-- Migration: Consolidate Property, Unit, and Listing into Rental
-- Created: 2025-08-02

-- Step 1: Create new Rental model
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "propertyType" "PropertyType" NOT NULL,
    "yearBuilt" INTEGER,
    "totalUnits" INTEGER NOT NULL DEFAULT 1,
    "amenities" JSONB,
    "unitNumber" TEXT,
    "floorNumber" INTEGER,
    "size" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "rent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "availableDate" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "leaseTerms" TEXT,
    "slug" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "managerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "whiteLabelConfigId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create RentalImage model
CREATE TABLE "RentalImage" (
    "id" SERIAL NOT NULL,
    "rentalId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalImage_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add rentalId columns to related tables
ALTER TABLE "Appliance" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "Application" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "BusinessHours" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "Document" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "EmergencyProtocol" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "EscalationPolicy" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "Lease" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "OnCallSchedule" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "PredictiveMaintenance" ADD COLUMN "rentalId" TEXT;
ALTER TABLE "WhiteLabelConfig" ADD COLUMN "rentalId" TEXT;

-- Step 4: Create indexes for Rental
CREATE UNIQUE INDEX "Rental_slug_key" ON "Rental"("slug");
CREATE INDEX "Rental_city_idx" ON "Rental"("city");
CREATE INDEX "Rental_state_idx" ON "Rental"("state");
CREATE INDEX "Rental_zipCode_idx" ON "Rental"("zipCode");
CREATE INDEX "Rental_propertyType_idx" ON "Rental"("propertyType");
CREATE INDEX "Rental_rent_idx" ON "Rental"("rent");
CREATE INDEX "Rental_isAvailable_idx" ON "Rental"("isAvailable");
CREATE INDEX "Rental_status_idx" ON "Rental"("status");
CREATE INDEX "Rental_managerId_idx" ON "Rental"("managerId");
CREATE INDEX "Rental_ownerId_idx" ON "Rental"("ownerId");

-- Step 5: Create indexes for RentalImage
CREATE INDEX "RentalImage_rentalId_idx" ON "RentalImage"("rentalId");
CREATE INDEX "RentalImage_isFeatured_idx" ON "RentalImage"("isFeatured");

-- Step 6: Create indexes for rentalId columns
CREATE INDEX "Appliance_rentalId_idx" ON "Appliance"("rentalId");
CREATE INDEX "Application_rentalId_idx" ON "Application"("rentalId");
CREATE INDEX "BusinessHours_rentalId_idx" ON "BusinessHours"("rentalId");
CREATE INDEX "Document_rentalId_idx" ON "Document"("rentalId");
CREATE INDEX "EmergencyProtocol_rentalId_idx" ON "EmergencyProtocol"("rentalId");
CREATE INDEX "EscalationPolicy_rentalId_idx" ON "EscalationPolicy"("rentalId");
CREATE INDEX "Lease_rentalId_idx" ON "Lease"("rentalId");
CREATE INDEX "MaintenanceRequest_rentalId_idx" ON "MaintenanceRequest"("rentalId");
CREATE INDEX "OnCallSchedule_rentalId_idx" ON "OnCallSchedule"("rentalId");
CREATE INDEX "PredictiveMaintenance_rentalId_idx" ON "PredictiveMaintenance"("rentalId");
CREATE INDEX "WhiteLabelConfig_rentalId_idx" ON "WhiteLabelConfig"("rentalId");

-- Step 7: Add foreign key constraints
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_whiteLabelConfigId_fkey" FOREIGN KEY ("whiteLabelConfigId") REFERENCES "WhiteLabelConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RentalImage" ADD CONSTRAINT "RentalImage_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Add foreign key constraints for rentalId columns
ALTER TABLE "Appliance" ADD CONSTRAINT "Appliance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmergencyProtocol" ADD CONSTRAINT "EmergencyProtocol_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EscalationPolicy" ADD CONSTRAINT "EscalationPolicy_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnCallSchedule" ADD CONSTRAINT "OnCallSchedule_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PredictiveMaintenance" ADD CONSTRAINT "PredictiveMaintenance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;