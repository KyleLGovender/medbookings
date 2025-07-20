/*
  Warnings:

  - You are about to drop the column `serviceProviderId` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `CalendarIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `CalendarIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `OrganizationProviderConnection` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `RequirementSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderTypeId` on the `RequirementType` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderTypeId` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `ServiceAvailabilityConfig` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `serviceProviderId` on the `UsageRecord` table. All the data in the column will be lost.
  - You are about to drop the `ServiceProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceProviderType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServiceToServiceProvider` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[providerId]` on the table `CalendarIntegration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,providerId]` on the table `OrganizationProviderConnection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requirementTypeId,providerId]` on the table `RequirementSubmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calendarProvider` to the `CalendarIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `CalendarIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `OrganizationProviderConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `RequirementSubmission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerTypeId` to the `RequirementType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerTypeId` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `ServiceAvailabilityConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `UsageRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'TRIAL', 'TRIAL_EXPIRED', 'ACTIVE', 'PAYMENT_OVERDUE', 'SUSPENDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarIntegration" DROP CONSTRAINT "CalendarIntegration_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationProviderConnection" DROP CONSTRAINT "OrganizationProviderConnection_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "RequirementSubmission" DROP CONSTRAINT "RequirementSubmission_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "RequirementType" DROP CONSTRAINT "RequirementType_serviceProviderTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_serviceProviderTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceAvailabilityConfig" DROP CONSTRAINT "ServiceAvailabilityConfig_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceProvider" DROP CONSTRAINT "ServiceProvider_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "ServiceProvider" DROP CONSTRAINT "ServiceProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceToServiceProvider" DROP CONSTRAINT "_ServiceToServiceProvider_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceToServiceProvider" DROP CONSTRAINT "_ServiceToServiceProvider_B_fkey";

-- DropIndex
DROP INDEX "Availability_serviceProviderId_startTime_endTime_idx";

-- DropIndex
DROP INDEX "CalendarIntegration_serviceProviderId_key";

-- DropIndex
DROP INDEX "OrganizationProviderConnection_organizationId_serviceProvid_key";

-- DropIndex
DROP INDEX "OrganizationProviderConnection_serviceProviderId_idx";

-- DropIndex
DROP INDEX "RequirementSubmission_requirementTypeId_serviceProviderId_key";

-- DropIndex
DROP INDEX "Review_serviceProviderId_status_idx";

-- DropIndex
DROP INDEX "Service_serviceProviderTypeId_displayPriority_idx";

-- DropIndex
DROP INDEX "ServiceAvailabilityConfig_serviceProviderId_idx";

-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CalendarIntegration" DROP COLUMN "provider",
DROP COLUMN "serviceProviderId",
ADD COLUMN     "calendarProvider" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationProviderConnection" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RequirementSubmission" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RequirementType" DROP COLUMN "serviceProviderTypeId",
ADD COLUMN     "providerTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "serviceProviderTypeId",
ADD COLUMN     "providerTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceAvailabilityConfig" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT;

-- AlterTable
ALTER TABLE "UsageRecord" DROP COLUMN "serviceProviderId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ServiceProvider";

-- DropTable
DROP TABLE "ServiceProviderType";

-- DropTable
DROP TABLE "_ServiceToServiceProvider";

-- DropEnum
DROP TYPE "ServiceProviderStatus";

-- CreateTable
CREATE TABLE "ProviderType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderTypeAssignment" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderTypeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT NOT NULL,
    "languages" "Languages"[],
    "website" TEXT,
    "email" TEXT NOT NULL DEFAULT 'default@example.com',
    "whatsapp" TEXT NOT NULL DEFAULT '+1234567890',
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "status" "ProviderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "trialStarted" TIMESTAMP(3),
    "trialEnded" TIMESTAMP(3),
    "trialStatus" "TrialStatus",
    "paymentMethodAdded" BOOLEAN NOT NULL DEFAULT false,
    "trialReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "trialConversionDate" TIMESTAMP(3),
    "selfPaidBookingsEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProviderToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderType_name_key" ON "ProviderType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderTypeAssignment_providerId_providerTypeId_key" ON "ProviderTypeAssignment"("providerId", "providerTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_userId_key" ON "Provider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProviderToService_AB_unique" ON "_ProviderToService"("A", "B");

-- CreateIndex
CREATE INDEX "_ProviderToService_B_index" ON "_ProviderToService"("B");

-- CreateIndex
CREATE INDEX "Availability_providerId_startTime_endTime_idx" ON "Availability"("providerId", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_providerId_key" ON "CalendarIntegration"("providerId");

-- CreateIndex
CREATE INDEX "OrganizationProviderConnection_providerId_idx" ON "OrganizationProviderConnection"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProviderConnection_organizationId_providerId_key" ON "OrganizationProviderConnection"("organizationId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementSubmission_requirementTypeId_providerId_key" ON "RequirementSubmission"("requirementTypeId", "providerId");

-- CreateIndex
CREATE INDEX "Review_providerId_status_idx" ON "Review"("providerId", "status");

-- CreateIndex
CREATE INDEX "Service_providerTypeId_displayPriority_idx" ON "Service"("providerTypeId", "displayPriority");

-- CreateIndex
CREATE INDEX "ServiceAvailabilityConfig_providerId_idx" ON "ServiceAvailabilityConfig"("providerId");

-- AddForeignKey
ALTER TABLE "ProviderTypeAssignment" ADD CONSTRAINT "ProviderTypeAssignment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderTypeAssignment" ADD CONSTRAINT "ProviderTypeAssignment_providerTypeId_fkey" FOREIGN KEY ("providerTypeId") REFERENCES "ProviderType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProviderConnection" ADD CONSTRAINT "OrganizationProviderConnection_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementType" ADD CONSTRAINT "RequirementType_providerTypeId_fkey" FOREIGN KEY ("providerTypeId") REFERENCES "ProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementSubmission" ADD CONSTRAINT "RequirementSubmission_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerTypeId_fkey" FOREIGN KEY ("providerTypeId") REFERENCES "ProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityConfig" ADD CONSTRAINT "ServiceAvailabilityConfig_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderToService" ADD CONSTRAINT "_ProviderToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderToService" ADD CONSTRAINT "_ProviderToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
