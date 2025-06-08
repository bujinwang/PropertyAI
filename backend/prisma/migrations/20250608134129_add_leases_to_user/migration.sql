/*
  Warnings:

  - Added the required column `tenantId` to the `Lease` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
