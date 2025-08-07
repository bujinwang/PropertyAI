-- Add enhanced fields to TenantRating table
ALTER TABLE "TenantRating" ADD COLUMN "categories" JSONB;
ALTER TABLE "TenantRating" ADD COLUMN "overallRating" DECIMAL(3,2);
ALTER TABLE "TenantRating" ADD COLUMN "tags" TEXT[];
ALTER TABLE "TenantRating" ADD COLUMN "attachments" TEXT[];

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_tenant_ratings_categories" ON "TenantRating" USING GIN ("categories");
CREATE INDEX IF NOT EXISTS "idx_tenant_ratings_overall" ON "TenantRating" ("overallRating");

-- Update existing records to have default category values
UPDATE "TenantRating" 
SET 
  "categories" = jsonb_build_object(
    'cleanliness', "rating",
    'communication', "rating", 
    'paymentHistory', "rating",
    'propertyCare', "rating"
  ),
  "overallRating" = "rating"
WHERE "categories" IS NULL;