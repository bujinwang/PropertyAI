-- Make unitId optional in listings table
ALTER TABLE "Listing" ALTER COLUMN "unitId" DROP NOT NULL;

-- Update unique constraint to allow nulls
DROP INDEX IF EXISTS "Listing_unitId_key";
CREATE UNIQUE INDEX "Listing_unitId_key" ON "Listing"("unitId") WHERE "unitId" IS NOT NULL;