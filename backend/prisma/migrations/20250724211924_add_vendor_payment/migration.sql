/*
  Warnings:

  - The values [ACCEPTED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [EXPIRED] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LEASE,OTHER] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REFUNDED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [FEES,MAINTENANCE] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `colors` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `objects` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `AIImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `warrantyExpiry` on the `Appliance` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AuditEntry` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `vendor` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `BackgroundCheck` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BusinessHours` table. All the data in the column will be lost.
  - You are about to drop the column `isClosed` on the `BusinessHours` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BusinessHours` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CostEstimation` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EmergencyProtocol` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `EmergencyRoutingRule` table. All the data in the column will be lost.
  - You are about to drop the column `delayMinutes` on the `EscalationPolicyRule` table. All the data in the column will be lost.
  - You are about to drop the column `escalateToId` on the `EscalationPolicyRule` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `EscalationPolicyRule` table. All the data in the column will be lost.
  - You are about to drop the column `intent` on the `KnowledgeBaseEntry` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `KnowledgeBaseEntry` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `KnowledgeBaseEntry` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MaintenanceResponseTime` table. All the data in the column will be lost.
  - You are about to drop the column `responseTime` on the `MaintenanceResponseTime` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `listingId` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `relatedId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedType` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `OAuthConnection` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `OAuthConnection` table. All the data in the column will be lost.
  - You are about to drop the column `providerUserId` on the `OAuthConnection` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `OAuthConnection` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `issuesDetected` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PhotoAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `component` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `predictedFailureDate` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `predictionDate` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PredictiveMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RiskAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `RiskAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RiskAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ScheduledEvent` table. All the data in the column will be lost.
  - You are about to drop the column `googleCalendarEventId` on the `ScheduledEvent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ScheduledEvent` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `creditScore` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `criminalHistory` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStatus` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `rentalHistory` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Screening` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `SocialMediaPlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `SocialMediaPlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TenantIssuePrediction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TenantIssuePrediction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the column `metricId` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VendorPerformanceRating` table. All the data in the column will be lost.
  - You are about to drop the column `appName` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `WhiteLabelConfig` table. All the data in the column will be lost.
  - You are about to drop the `AIListingSuggestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AIPricingSuggestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CampaignAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeBase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ListingImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketingCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageReference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PerformanceMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublishedListing` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[applicationId]` on the table `BackgroundCheck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,providerId]` on the table `OAuthConnection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `WhiteLabelConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `analysisResult` to the `AIImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `AIImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Appliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `AuditEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidenceScore` to the `CostEstimation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `EmergencyProtocol` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `EmergencyProtocol` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyword` to the `EmergencyRoutingRule` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `priority` on the `EmergencyRoutingRule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `order` to the `EscalationPolicyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `EscalationPolicyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answer` to the `KnowledgeBaseEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `KnowledgeBaseEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateAvailable` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postedById` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rent` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `averageRent` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bedroomCount` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `demandScore` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalYield` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyScore` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vacancyRate` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearOverYearGrowth` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Made the column `pricePerSqFt` on table `MarketData` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `propertyType` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `OAuthConnection` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `provider` on the `OAuthConnection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `analysisResult` to the `PhotoAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `PhotoAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `PredictiveMaintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendedAction` to the `PredictiveMaintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urgency` to the `PredictiveMaintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `RiskAssessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `RiskAssessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ScheduledEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `Screening` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `Screening` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `SocialMediaPlatformConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `TenantIssuePrediction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `WhiteLabelConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `WhiteLabelConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WhiteLabelConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'REVIEW', 'APPROVED', 'REJECTED');
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'RENTED', 'DRAFT');
ALTER TABLE "Listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('GENERAL', 'MAINTENANCE', 'PAYMENT', 'ANNOUNCEMENT');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
ALTER TABLE "Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('RENT', 'FEE', 'DEPOSIT', 'REFUND', 'OTHER');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AIImageAnalysis" DROP CONSTRAINT "AIImageAnalysis_imageId_fkey";

-- DropForeignKey
ALTER TABLE "AIListingSuggestion" DROP CONSTRAINT "AIListingSuggestion_listingId_fkey";

-- DropForeignKey
ALTER TABLE "AIPricingSuggestion" DROP CONSTRAINT "AIPricingSuggestion_listingId_fkey";

-- DropForeignKey
ALTER TABLE "CampaignAnalytics" DROP CONSTRAINT "CampaignAnalytics_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyRoutingRule" DROP CONSTRAINT "EmergencyRoutingRule_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "EscalationPolicyRule" DROP CONSTRAINT "EscalationPolicyRule_escalateToId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_listingId_fkey";

-- DropForeignKey
ALTER TABLE "MarketingCampaign" DROP CONSTRAINT "MarketingCampaign_listingId_fkey";

-- DropForeignKey
ALTER TABLE "PublishedListing" DROP CONSTRAINT "PublishedListing_listingId_fkey";

-- DropForeignKey
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT "WhiteLabelConfig_propertyId_fkey";

-- DropIndex
DROP INDEX "AIImageAnalysis_imageId_key";

-- DropIndex
DROP INDEX "BusinessHours_propertyId_dayOfWeek_key";

-- DropIndex
DROP INDEX "EmergencyProtocol_propertyId_priority_key";

-- DropIndex
DROP INDEX "KnowledgeBaseEntry_intent_key";

-- DropIndex
DROP INDEX "Listing_status_idx";

-- DropIndex
DROP INDEX "MaintenanceRequest_requestedById_idx";

-- DropIndex
DROP INDEX "Message_conversationId_idx";

-- DropIndex
DROP INDEX "Message_recipientId_idx";

-- DropIndex
DROP INDEX "Message_senderId_idx";

-- DropIndex
DROP INDEX "OAuthConnection_provider_userId_key";

-- DropIndex
DROP INDEX "WhiteLabelConfig_propertyId_key";

-- AlterTable
ALTER TABLE "AIImageAnalysis" DROP COLUMN "colors",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "imageId",
DROP COLUMN "objects",
DROP COLUMN "quality",
DROP COLUMN "tags",
ADD COLUMN     "analysisResult" JSONB NOT NULL,
ADD COLUMN     "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "maintenanceRequestId" TEXT;

-- AlterTable
ALTER TABLE "Appliance" DROP COLUMN "createdAt",
DROP COLUMN "serialNumber",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "warrantyExpiry",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "warrantyExpiryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "backgroundCheckId" TEXT,
ADD COLUMN     "creditScore" INTEGER,
ADD COLUMN     "employmentStatus" TEXT,
ADD COLUMN     "income" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AuditEntry" DROP COLUMN "createdAt",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "details",
ADD COLUMN     "details" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "BackgroundCheck" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "vendor",
DROP COLUMN "vendorId",
ADD COLUMN     "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditHistory" TEXT,
ADD COLUMN     "criminalHistory" TEXT,
ADD COLUMN     "employmentHistory" TEXT,
ADD COLUMN     "evictionHistory" TEXT,
ADD COLUMN     "reportUrl" TEXT;

-- AlterTable
ALTER TABLE "BusinessHours" DROP COLUMN "createdAt",
DROP COLUMN "isClosed",
DROP COLUMN "updatedAt",
ALTER COLUMN "dayOfWeek" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CostEstimation" DROP COLUMN "confidence",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "laborCost" DOUBLE PRECISION,
ADD COLUMN     "materialsCost" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "EmergencyProtocol" DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
DROP COLUMN "createdAt",
DROP COLUMN "instructions",
DROP COLUMN "priority",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmergencyRoutingRule" DROP COLUMN "categoryId",
ADD COLUMN     "keyword" TEXT NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "EscalationPolicyRule" DROP COLUMN "delayMinutes",
DROP COLUMN "escalateToId",
DROP COLUMN "priority",
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KnowledgeBaseEntry" DROP COLUMN "intent",
DROP COLUMN "keywords",
DROP COLUMN "response",
ADD COLUMN     "answer" TEXT NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "authorId",
DROP COLUMN "expiresAt",
DROP COLUMN "price",
DROP COLUMN "publishedAt",
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "applicationFee" DOUBLE PRECISION,
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "dateAvailable" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leaseTerms" TEXT,
ADD COLUMN     "postedById" TEXT NOT NULL,
ADD COLUMN     "rent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "virtualTourUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "MaintenanceResponseTime" DROP COLUMN "createdAt",
DROP COLUMN "responseTime",
ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MarketData" DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "city",
DROP COLUMN "createdAt",
DROP COLUMN "date",
DROP COLUMN "listingId",
DROP COLUMN "price",
DROP COLUMN "propertyId",
DROP COLUMN "source",
DROP COLUMN "state",
DROP COLUMN "updatedAt",
DROP COLUMN "zipCode",
ADD COLUMN     "averageRent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "bedroomCount" INTEGER NOT NULL,
ADD COLUMN     "dateRecorded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "demandScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "rentalYield" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "supplyScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "vacancyRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "yearOverYearGrowth" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "pricePerSqFt" SET NOT NULL,
DROP COLUMN "propertyType",
ADD COLUMN     "propertyType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "relatedId",
DROP COLUMN "relatedType",
DROP COLUMN "title",
ALTER COLUMN "type" SET DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "providerUserId",
DROP COLUMN "updatedAt",
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "scopes" TEXT[],
DROP COLUMN "provider",
ADD COLUMN     "provider" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhotoAnalysis" DROP COLUMN "createdAt",
DROP COLUMN "issuesDetected",
DROP COLUMN "recommendations",
DROP COLUMN "severity",
DROP COLUMN "updatedAt",
ADD COLUMN     "analysisResult" JSONB NOT NULL,
ADD COLUMN     "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PredictiveMaintenance" DROP COLUMN "component",
DROP COLUMN "predictedFailureDate",
DROP COLUMN "predictionDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "recommendedAction" TEXT NOT NULL,
ADD COLUMN     "urgency" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "whiteLabelConfigId" TEXT;

-- AlterTable
ALTER TABLE "RiskAssessment" DROP COLUMN "createdAt",
DROP COLUMN "summary",
DROP COLUMN "updatedAt",
ADD COLUMN     "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "details" JSONB NOT NULL,
ADD COLUMN     "level" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScheduledEvent" DROP COLUMN "createdAt",
DROP COLUMN "googleCalendarEventId",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Screening" DROP COLUMN "createdAt",
DROP COLUMN "creditScore",
DROP COLUMN "criminalHistory",
DROP COLUMN "employmentStatus",
DROP COLUMN "income",
DROP COLUMN "rentalHistory",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "conductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "details" JSONB NOT NULL,
ADD COLUMN     "result" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SocialMediaPlatformConfig" DROP COLUMN "clientId",
DROP COLUMN "isEnabled",
ADD COLUMN     "refreshToken" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TenantIssuePrediction" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "details" JSONB NOT NULL,
ADD COLUMN     "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "VendorPerformanceRating" DROP COLUMN "createdAt",
DROP COLUMN "metricId",
DROP COLUMN "updatedAt",
ADD COLUMN     "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WhiteLabelConfig" DROP COLUMN "appName",
DROP COLUMN "logoUrl",
DROP COLUMN "primaryColor",
DROP COLUMN "propertyId",
DROP COLUMN "secondaryColor",
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "AIListingSuggestion";

-- DropTable
DROP TABLE "AIPricingSuggestion";

-- DropTable
DROP TABLE "CampaignAnalytics";

-- DropTable
DROP TABLE "FinancialReport";

-- DropTable
DROP TABLE "KnowledgeBase";

-- DropTable
DROP TABLE "ListingImage";

-- DropTable
DROP TABLE "MarketingCampaign";

-- DropTable
DROP TABLE "MessageReference";

-- DropTable
DROP TABLE "PerformanceMetric";

-- DropTable
DROP TABLE "PublishedListing";

-- DropEnum
DROP TYPE "CampaignStatus";

-- DropEnum
DROP TYPE "PublishingPlatform";

-- DropEnum
DROP TYPE "ScreeningStatus";

-- CreateTable
CREATE TABLE "TenantRating" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbOptimizationLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "durationMs" INTEGER,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "DbOptimizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "workOrderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantRating_leaseId_idx" ON "TenantRating"("leaseId");

-- CreateIndex
CREATE INDEX "TenantRating_tenantId_idx" ON "TenantRating"("tenantId");

-- CreateIndex
CREATE INDEX "TenantRating_raterId_idx" ON "TenantRating"("raterId");

-- CreateIndex
CREATE INDEX "Photo_listingId_idx" ON "Photo"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_workOrderId_key" ON "VendorPayment"("workOrderId");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "Appliance_unitId_idx" ON "Appliance"("unitId");

-- CreateIndex
CREATE INDEX "Application_applicantId_idx" ON "Application"("applicantId");

-- CreateIndex
CREATE INDEX "Application_listingId_idx" ON "Application"("listingId");

-- CreateIndex
CREATE INDEX "AuditEntry_userId_idx" ON "AuditEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundCheck_applicationId_key" ON "BackgroundCheck"("applicationId");

-- CreateIndex
CREATE INDEX "BusinessHours_propertyId_idx" ON "BusinessHours"("propertyId");

-- CreateIndex
CREATE INDEX "EmergencyProtocol_propertyId_idx" ON "EmergencyProtocol"("propertyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseEntry_category_idx" ON "KnowledgeBaseEntry"("category");

-- CreateIndex
CREATE INDEX "Listing_propertyId_idx" ON "Listing"("propertyId");

-- CreateIndex
CREATE INDEX "MarketData_location_idx" ON "MarketData"("location");

-- CreateIndex
CREATE INDEX "MarketData_propertyType_idx" ON "MarketData"("propertyType");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthConnection_provider_providerId_key" ON "OAuthConnection"("provider", "providerId");

-- CreateIndex
CREATE INDEX "PredictiveMaintenance_unitId_idx" ON "PredictiveMaintenance"("unitId");

-- CreateIndex
CREATE INDEX "TenantIssuePrediction_tenantId_idx" ON "TenantIssuePrediction"("tenantId");

-- CreateIndex
CREATE INDEX "Transaction_leaseId_idx" ON "Transaction"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_stripeAccountId_key" ON "Vendor"("stripeAccountId");

-- CreateIndex
CREATE INDEX "VendorPerformanceRating_vendorId_idx" ON "VendorPerformanceRating"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPerformanceRating_workOrderId_idx" ON "VendorPerformanceRating"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelConfig_token_key" ON "WhiteLabelConfig"("token");

-- CreateIndex
CREATE INDEX "WhiteLabelConfig_userId_idx" ON "WhiteLabelConfig"("userId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_whiteLabelConfigId_fkey" FOREIGN KEY ("whiteLabelConfigId") REFERENCES "WhiteLabelConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRating" ADD CONSTRAINT "TenantRating_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRating" ADD CONSTRAINT "TenantRating_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRating" ADD CONSTRAINT "TenantRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPerformanceRating" ADD CONSTRAINT "VendorPerformanceRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPerformanceRating" ADD CONSTRAINT "VendorPerformanceRating_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationPolicyRule" ADD CONSTRAINT "EscalationPolicyRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
