/*
  Warnings:

  - You are about to drop the column `location` on the `ServiceAvailabilityConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SchedulingRule" AS ENUM ('CONTINUOUS', 'FIXED_INTERVAL', 'CUSTOM_INTERVAL');

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "isOnlineAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrencePattern" JSONB,
ADD COLUMN     "schedulingInterval" INTEGER,
ADD COLUMN     "schedulingRule" "SchedulingRule" NOT NULL DEFAULT 'CONTINUOUS',
ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "ServiceAvailabilityConfig" DROP COLUMN "location",
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Availability_seriesId_idx" ON "Availability"("seriesId");

-- CreateIndex
CREATE INDEX "ServiceAvailabilityConfig_locationId_idx" ON "ServiceAvailabilityConfig"("locationId");

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityConfig" ADD CONSTRAINT "ServiceAvailabilityConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
