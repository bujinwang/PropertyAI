/*
  Warnings:

  - A unique constraint covering the columns `[unitId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_unitId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Listing_unitId_key" ON "Listing"("unitId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
