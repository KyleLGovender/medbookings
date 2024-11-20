/*
  Warnings:

  - You are about to drop the `_AvailabilityToService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BookingToService` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `image` on table `ServiceProvider` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_AvailabilityToService" DROP CONSTRAINT "_AvailabilityToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_AvailabilityToService" DROP CONSTRAINT "_AvailabilityToService_B_fkey";

-- DropForeignKey
ALTER TABLE "_BookingToService" DROP CONSTRAINT "_BookingToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookingToService" DROP CONSTRAINT "_BookingToService_B_fkey";

-- AlterTable
ALTER TABLE "ServiceProvider" ALTER COLUMN "image" SET NOT NULL;

-- DropTable
DROP TABLE "_AvailabilityToService";

-- DropTable
DROP TABLE "_BookingToService";
