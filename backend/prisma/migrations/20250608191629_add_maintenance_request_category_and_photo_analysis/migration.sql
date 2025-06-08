/*
  Warnings:

  - You are about to drop the `Sentiment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Translation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sentiment" DROP CONSTRAINT "Sentiment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Translation" DROP CONSTRAINT "Translation_messageId_fkey";

-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "categoryId" TEXT;

-- DropTable
DROP TABLE "Sentiment";

-- DropTable
DROP TABLE "Translation";

-- CreateTable
CREATE TABLE "MaintenanceRequestCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MaintenanceRequestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRequestCategory_name_key" ON "MaintenanceRequestCategory"("name");

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaintenanceRequestCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
