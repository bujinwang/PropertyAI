/*
  Warnings:

  - Changed the type of `availability` on the `Vendor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "standardRate" DOUBLE PRECISION,
DROP COLUMN "availability",
ADD COLUMN     "availability" TEXT NOT NULL;
