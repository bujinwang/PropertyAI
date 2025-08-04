/*
  Warnings:

  - You are about to drop the column `unitId` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `listingId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `BusinessHours` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `EscalationPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `OnCallSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `rentalId` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the `Listing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ListingImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Property` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Unit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnitImage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rentalId,applicantId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rentalId,dayOfWeek]` on the table `BusinessHours` will be added. If there are existing duplicate values, this will fail.
  - Made the column `rentalId` on table `Appliance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `Application` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `BusinessHours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `EmergencyProtocol` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `EscalationPolicy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `OnCallSchedule` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentalId` on table `PredictiveMaintenance` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Appliance" DROP CONSTRAINT "Appliance_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "Appliance" DROP CONSTRAINT "Appliance_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessHours" DROP CONSTRAINT "BusinessHours_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyProtocol" DROP CONSTRAINT "EmergencyProtocol_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "EscalationPolicy" DROP CONSTRAINT "EscalationPolicy_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_listingId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_propertyImageId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_unitImageId_fkey";

-- DropForeignKey
ALTER TABLE "OnCallSchedule" DROP CONSTRAINT "OnCallSchedule_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "PredictiveMaintenance" DROP CONSTRAINT "PredictiveMaintenance_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "PredictiveMaintenance" DROP CONSTRAINT "PredictiveMaintenance_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_managerId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_whiteLabelConfigId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyImage" DROP CONSTRAINT "PropertyImage_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UnitImage" DROP CONSTRAINT "UnitImage_unitId_fkey";

-- DropForeignKey
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT "WhiteLabelConfig_rentalId_fkey";

-- DropIndex
DROP INDEX "Application_listingId_applicantId_key";

-- DropIndex
DROP INDEX "Application_rentalId_idx";

-- DropIndex
DROP INDEX "BusinessHours_propertyId_dayOfWeek_key";

-- DropIndex
DROP INDEX "BusinessHours_rentalId_idx";

-- DropIndex
DROP INDEX "Document_rentalId_idx";

-- DropIndex
DROP INDEX "EmergencyProtocol_rentalId_idx";

-- DropIndex
DROP INDEX "EscalationPolicy_rentalId_idx";

-- DropIndex
DROP INDEX "Lease_rentalId_idx";

-- DropIndex
DROP INDEX "OnCallSchedule_rentalId_idx";

-- DropIndex
DROP INDEX "PredictiveMaintenance_unitId_idx";

-- DropIndex
DROP INDEX "WhiteLabelConfig_rentalId_idx";

-- AlterTable
ALTER TABLE "Appliance" DROP COLUMN "unitId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "listingId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "BusinessHours" DROP COLUMN "propertyId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "propertyId";

-- AlterTable
ALTER TABLE "EmergencyProtocol" DROP COLUMN "propertyId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EscalationPolicy" DROP COLUMN "propertyId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OnCallSchedule" DROP COLUMN "propertyId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PredictiveMaintenance" DROP COLUMN "unitId",
ALTER COLUMN "rentalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WhiteLabelConfig" DROP COLUMN "rentalId";

-- DropTable
DROP TABLE "Listing";

-- DropTable
DROP TABLE "ListingImage";

-- DropTable
DROP TABLE "Property";

-- DropTable
DROP TABLE "PropertyImage";

-- DropTable
DROP TABLE "Unit";

-- DropTable
DROP TABLE "UnitImage";

-- CreateTable
CREATE TABLE "_RentalWhiteLabelConfigs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RentalWhiteLabelConfigs_AB_unique" ON "_RentalWhiteLabelConfigs"("A", "B");

-- CreateIndex
CREATE INDEX "_RentalWhiteLabelConfigs_B_index" ON "_RentalWhiteLabelConfigs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Application_rentalId_applicantId_key" ON "Application"("rentalId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_rentalId_dayOfWeek_key" ON "BusinessHours"("rentalId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "Appliance" ADD CONSTRAINT "Appliance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveMaintenance" ADD CONSTRAINT "PredictiveMaintenance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RentalWhiteLabelConfigs" ADD CONSTRAINT "_RentalWhiteLabelConfigs_A_fkey" FOREIGN KEY ("A") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RentalWhiteLabelConfigs" ADD CONSTRAINT "_RentalWhiteLabelConfigs_B_fkey" FOREIGN KEY ("B") REFERENCES "WhiteLabelConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
