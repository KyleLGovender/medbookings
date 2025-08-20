/*
  Warnings:

  - The values [CANCELLED] on the enum `AvailabilityStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AvailabilityStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "Availability" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Availability" ALTER COLUMN "status" TYPE "AvailabilityStatus_new" USING ("status"::text::"AvailabilityStatus_new");
ALTER TYPE "AvailabilityStatus" RENAME TO "AvailabilityStatus_old";
ALTER TYPE "AvailabilityStatus_new" RENAME TO "AvailabilityStatus";
DROP TYPE "AvailabilityStatus_old";
ALTER TABLE "Availability" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
