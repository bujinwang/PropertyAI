-- CreateEnum
CREATE TYPE "VendorAvailability" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'ON_VACATION');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "availability" "VendorAvailability" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "serviceAreas" TEXT[],
ADD COLUMN     "workload" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
