/*
  Warnings:

  - The values [REVIEW] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INACTIVE,RENTED] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PROCESSING] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANCELLED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RENT,FEE,DEPOSIT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `analyzedAt` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceRequestId` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `warrantyExpiryDate` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundCheckId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `creditScore` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStatus` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `applicationId` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `checkedAt` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `creditHistory` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `criminalHistory` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `employmentHistory` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `evictionHistory` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `consent` on the `Consent` table. All the data in the column will be lost.
  - You are about to drop the column `confidenceScore` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `estimationDate` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `laborCost` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `materialsCost` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `keyword` on the `EmergencyRoutingRule` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EscalationPolicyRule` table. All the data in the column will be lost.
  - You are about to drop the column `amenities` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `applicationFee` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `contactInfo` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `dateAvailable` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `postedById` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `virtualTourUrl` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `acknowledgedAt` on the `MaintenanceResponseTime` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `MaintenanceResponseTime` table. All the data in the column will be lost.
  - You are about to drop the column `bedroomCount` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `dateRecorded` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `demandScore` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerSqFt` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `rentalYield` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `supplyScore` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `yearOverYearGrowth` on the `MarketData` table. All the data in the column will be lost.
  - The `propertyType` column on the `MarketData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `OAuthConnection` table. All the data in the column will be lost.
  - You are about to drop the column `analyzedAt` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedAction` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `urgency` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `assessedAt` on the `RiskAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `RiskAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `conductedAt` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `TenantIssuePrediction` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `TenantIssuePrediction` table. All the data in the column will be lost.
  - You are about to drop the column `prediction` on the `TenantIssuePrediction` table. All the data in the column will be lost.
  - You are about to drop the column `approvalStatus` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `approvalStatus` on the `VendorPayment` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `VendorPayment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `VendorPayment` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `VendorPayment` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the column `ratedAt` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DbOptimizationLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelPerformance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialMediaPlatformConfig` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[imageId]` on the table `AIImageAnalysis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listingId,applicantId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicantId]` on the table `BackgroundCheck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,dayOfWeek]` on the table `BusinessHours` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,type]` on the table `Consent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[priority]` on the table `EmergencyRoutingRule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[policyId,order]` on the table `EscalationPolicyRule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unitId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[location,dataDate,propertyType,bedrooms]` on the table `MarketData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listingId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vendorId,workOrderId]` on the table `VendorPerformanceRating` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imageId` to the `AIImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AIImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Appliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Appliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `AuditEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `AuditEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantId` to the `BackgroundCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BackgroundCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BusinessHours` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dayOfWeek` on the `BusinessHours` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `Consent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CostEstimation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceType` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EmergencyProtocol` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `priority` on the `EmergencyRoutingRule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `action` to the `EscalationPolicyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `threshold` to the `EscalationPolicyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availableDate` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MaintenanceRequestCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responseTime` to the `MaintenanceResponseTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MaintenanceResponseTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `OAuthConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PhotoAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PredictiveMaintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RiskAssessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ScheduledEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Screening` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Screening` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueType` to the `TenantIssuePrediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `likelihood` to the `TenantIssuePrediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TenantIssuePrediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `VendorPerformanceRating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VendorPerformanceRating` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UXReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UXReviewPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UXComponentType" AS ENUM ('DASHBOARD', 'PROPERTY_PAGE', 'UNIT_PAGE', 'MAINTENANCE_FLOW', 'LEASING_FLOW', 'ONBOARDING', 'SETTINGS', 'OTHER');

-- CreateEnum
CREATE TYPE "UXReviewAssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING');

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('ACTIVE', 'PENDING', 'DRAFT', 'ARCHIVED');
ALTER TABLE "Listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FAILED', 'REFUNDED');
ALTER TABLE "VendorPayment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VendorPayment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "VendorPayment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('RENT_PAYMENT', 'SECURITY_DEPOSIT', 'MAINTENANCE_FEE', 'REFUND', 'OTHER');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditEntry" DROP CONSTRAINT "AuditEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "BackgroundCheck" DROP CONSTRAINT "BackgroundCheck_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "EscalationPolicyRule" DROP CONSTRAINT "EscalationPolicyRule_userId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_postedById_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_listingId_fkey";

-- DropIndex
DROP INDEX "Appliance_unitId_idx";

-- DropIndex
DROP INDEX "Application_applicantId_idx";

-- DropIndex
DROP INDEX "Application_listingId_idx";

-- DropIndex
DROP INDEX "BackgroundCheck_applicationId_key";

-- DropIndex
DROP INDEX "BusinessHours_propertyId_idx";

-- DropIndex
DROP INDEX "Device_token_key";

-- DropIndex
DROP INDEX "EmergencyProtocol_propertyId_idx";

-- DropIndex
DROP INDEX "Listing_propertyId_idx";

-- DropIndex
DROP INDEX "MarketData_propertyType_idx";

-- DropIndex
DROP INDEX "VendorPayment_workOrderId_key";

-- DropIndex
DROP INDEX "VendorPerformanceRating_workOrderId_idx";

-- AlterTable
ALTER TABLE "AIImageAnalysis" DROP COLUMN "analyzedAt",
DROP COLUMN "imageUrl",
DROP COLUMN "maintenanceRequestId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "analysisResult" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "permissions",
DROP COLUMN "updatedAt",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Appliance" DROP COLUMN "brand",
DROP COLUMN "model",
DROP COLUMN "purchaseDate",
DROP COLUMN "warrantyExpiryDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "backgroundCheckId",
DROP COLUMN "creditScore",
DROP COLUMN "employmentStatus",
DROP COLUMN "income",
DROP COLUMN "submittedAt",
ADD COLUMN     "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AuditEntry" ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "entityType" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "details" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BackgroundCheck" DROP COLUMN "applicationId",
DROP COLUMN "checkedAt",
DROP COLUMN "creditHistory",
DROP COLUMN "criminalHistory",
DROP COLUMN "employmentHistory",
DROP COLUMN "evictionHistory",
ADD COLUMN     "applicantId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "BusinessHours" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Consent" DROP COLUMN "consent",
ADD COLUMN     "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CostEstimation" DROP COLUMN "confidenceScore",
DROP COLUMN "estimationDate",
DROP COLUMN "laborCost",
DROP COLUMN "materialsCost",
DROP COLUMN "notes",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "platform",
DROP COLUMN "token",
ADD COLUMN     "deviceType" TEXT NOT NULL,
ADD COLUMN     "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "pushToken" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "cdnUrl" TEXT,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "thumbnailCdnUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "EmergencyProtocol" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instructions" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EmergencyRoutingRule" DROP COLUMN "keyword",
DROP COLUMN "priority",
ADD COLUMN     "priority" "Priority" NOT NULL;

-- AlterTable
ALTER TABLE "EscalationPolicyRule" DROP COLUMN "userId",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "threshold" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KnowledgeBaseEntry" ADD COLUMN     "keywords" TEXT[],
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "amenities",
DROP COLUMN "applicationFee",
DROP COLUMN "contactInfo",
DROP COLUMN "dateAvailable",
DROP COLUMN "isAvailable",
DROP COLUMN "postedById",
DROP COLUMN "virtualTourUrl",
ADD COLUMN     "availableDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unitId" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaintenanceRequestCategory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MaintenanceResponseTime" DROP COLUMN "acknowledgedAt",
DROP COLUMN "resolvedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "responseTime" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MarketData" DROP COLUMN "bedroomCount",
DROP COLUMN "dateRecorded",
DROP COLUMN "demandScore",
DROP COLUMN "pricePerSqFt",
DROP COLUMN "rentalYield",
DROP COLUMN "supplyScore",
DROP COLUMN "yearOverYearGrowth",
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "dataDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "propertyType",
ADD COLUMN     "propertyType" "PropertyType";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "createdAt",
DROP COLUMN "isRead",
DROP COLUMN "recipientId",
DROP COLUMN "sentiment",
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "conversationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "link" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "scopes",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "PhotoAnalysis" DROP COLUMN "analyzedAt",
DROP COLUMN "imageUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "analysisResult" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PredictiveMaintenance" DROP COLUMN "confidence",
DROP COLUMN "description",
DROP COLUMN "recommendedAction",
DROP COLUMN "urgency",
ADD COLUMN     "prediction" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RiskAssessment" DROP COLUMN "assessedAt",
DROP COLUMN "level",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "details" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduledEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Screening" DROP COLUMN "conductedAt",
DROP COLUMN "details",
DROP COLUMN "result",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reportUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TenantIssuePrediction" DROP COLUMN "confidence",
DROP COLUMN "details",
DROP COLUMN "prediction",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "issueType" TEXT NOT NULL,
ADD COLUMN     "likelihood" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "approvalStatus",
DROP COLUMN "approvedAt",
DROP COLUMN "paymentMethod",
DROP COLUMN "processedAt",
DROP COLUMN "reference",
ADD COLUMN     "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "VendorPayment" DROP COLUMN "approvalStatus",
DROP COLUMN "approvedAt",
DROP COLUMN "notes",
DROP COLUMN "processedAt",
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VendorPerformanceRating" DROP COLUMN "comments",
DROP COLUMN "ratedAt",
DROP COLUMN "score",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "WhiteLabelConfig" ADD COLUMN     "appName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT;

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "DbOptimizationLog";

-- DropTable
DROP TABLE "ModelPerformance";

-- DropTable
DROP TABLE "Photo";

-- DropTable
DROP TABLE "SocialMediaPlatformConfig";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PaymentApprovalStatus";

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "propertyImageId" INTEGER,
    "unitImageId" INTEGER,
    "url" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccessToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OAuthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toolName" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "cost" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXReview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "UXReviewStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "UXReviewPriority" NOT NULL DEFAULT 'MEDIUM',
    "componentType" "UXComponentType" NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXReviewComment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXReviewAssignment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "status" "UXReviewAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXSurvey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXSurveyQuestion" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXSurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXSurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UXSurveyAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UXSurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");

-- CreateIndex
CREATE INDEX "ListingImage_propertyImageId_idx" ON "ListingImage"("propertyImageId");

-- CreateIndex
CREATE INDEX "ListingImage_unitImageId_idx" ON "ListingImage"("unitImageId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccessToken_accessToken_key" ON "OAuthAccessToken"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_toolName_idx" ON "AIUsageLog"("toolName");

-- CreateIndex
CREATE INDEX "UXReview_status_idx" ON "UXReview"("status");

-- CreateIndex
CREATE INDEX "UXReview_priority_idx" ON "UXReview"("priority");

-- CreateIndex
CREATE INDEX "UXReview_componentType_idx" ON "UXReview"("componentType");

-- CreateIndex
CREATE INDEX "UXReview_reviewerId_idx" ON "UXReview"("reviewerId");

-- CreateIndex
CREATE INDEX "UXReviewComment_reviewId_idx" ON "UXReviewComment"("reviewId");

-- CreateIndex
CREATE INDEX "UXReviewComment_authorId_idx" ON "UXReviewComment"("authorId");

-- CreateIndex
CREATE INDEX "UXReviewAssignment_reviewId_idx" ON "UXReviewAssignment"("reviewId");

-- CreateIndex
CREATE INDEX "UXReviewAssignment_assigneeId_idx" ON "UXReviewAssignment"("assigneeId");

-- CreateIndex
CREATE INDEX "UXReviewAssignment_status_idx" ON "UXReviewAssignment"("status");

-- CreateIndex
CREATE INDEX "UXSurvey_status_idx" ON "UXSurvey"("status");

-- CreateIndex
CREATE INDEX "UXSurvey_createdById_idx" ON "UXSurvey"("createdById");

-- CreateIndex
CREATE INDEX "UXSurveyQuestion_surveyId_idx" ON "UXSurveyQuestion"("surveyId");

-- CreateIndex
CREATE INDEX "UXSurveyResponse_surveyId_idx" ON "UXSurveyResponse"("surveyId");

-- CreateIndex
CREATE INDEX "UXSurveyResponse_respondentId_idx" ON "UXSurveyResponse"("respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "UXSurveyAnswer_responseId_questionId_key" ON "UXSurveyAnswer"("responseId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AIImageAnalysis_imageId_key" ON "AIImageAnalysis"("imageId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_listingId_applicantId_key" ON "Application"("listingId", "applicantId");

-- CreateIndex
CREATE INDEX "AuditEntry_entityType_idx" ON "AuditEntry"("entityType");

-- CreateIndex
CREATE INDEX "AuditEntry_entityId_idx" ON "AuditEntry"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundCheck_applicantId_key" ON "BackgroundCheck"("applicantId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_applicantId_idx" ON "BackgroundCheck"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_propertyId_dayOfWeek_key" ON "BusinessHours"("propertyId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_userId_type_key" ON "Consent"("userId", "type");

-- CreateIndex
CREATE INDEX "EmergencyRoutingRule_vendorId_idx" ON "EmergencyRoutingRule"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyRoutingRule_priority_key" ON "EmergencyRoutingRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "EscalationPolicyRule_policyId_order_key" ON "EscalationPolicyRule"("policyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_unitId_key" ON "Listing"("unitId");

-- CreateIndex
CREATE INDEX "MarketData_dataDate_idx" ON "MarketData"("dataDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_location_dataDate_propertyType_bedrooms_key" ON "MarketData"("location", "dataDate", "propertyType", "bedrooms");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "OAuthConnection_userId_idx" ON "OAuthConnection"("userId");

-- CreateIndex
CREATE INDEX "RiskAssessment_applicationId_idx" ON "RiskAssessment"("applicationId");

-- CreateIndex
CREATE INDEX "Screening_applicationId_idx" ON "Screening"("applicationId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_listingId_key" ON "Unit"("listingId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_workOrderId_idx" ON "VendorPayment"("workOrderId");

-- CreateIndex
CREATE INDEX "VendorPayment_status_idx" ON "VendorPayment"("status");

-- CreateIndex
CREATE INDEX "VendorPerformanceRating_ratedById_idx" ON "VendorPerformanceRating"("ratedById");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPerformanceRating_vendorId_workOrderId_key" ON "VendorPerformanceRating"("vendorId", "workOrderId");

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_propertyImageId_fkey" FOREIGN KEY ("propertyImageId") REFERENCES "PropertyImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_unitImageId_fkey" FOREIGN KEY ("unitImageId") REFERENCES "UnitImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccessToken" ADD CONSTRAINT "OAuthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationPolicyRule" ADD CONSTRAINT "EscalationPolicyRule_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXReview" ADD CONSTRAINT "UXReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXReviewComment" ADD CONSTRAINT "UXReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "UXReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXReviewComment" ADD CONSTRAINT "UXReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXReviewAssignment" ADD CONSTRAINT "UXReviewAssignment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "UXReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXReviewAssignment" ADD CONSTRAINT "UXReviewAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurvey" ADD CONSTRAINT "UXSurvey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurveyQuestion" ADD CONSTRAINT "UXSurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "UXSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurveyResponse" ADD CONSTRAINT "UXSurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "UXSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurveyResponse" ADD CONSTRAINT "UXSurveyResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurveyAnswer" ADD CONSTRAINT "UXSurveyAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "UXSurveyResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UXSurveyAnswer" ADD CONSTRAINT "UXSurveyAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "UXSurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
