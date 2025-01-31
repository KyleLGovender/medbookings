/*
  Warnings:

  - Added the required column `serviceConfigId` to the `CalculatedAvailabilitySlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalculatedAvailabilitySlot" ADD COLUMN     "serviceConfigId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_serviceConfigId_fkey" FOREIGN KEY ("serviceConfigId") REFERENCES "ServiceAvailabilityConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
