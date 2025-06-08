-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'USER';

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "listingId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerSqFt" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "zipCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "propertyType" "PropertyType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);
