/*
  Warnings:

  - The values [FIXED_INTERVAL,CUSTOM_INTERVAL] on the enum `SchedulingRule` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SchedulingRule_new" AS ENUM ('CONTINUOUS', 'ON_THE_HOUR', 'ON_THE_HALF_HOUR');
ALTER TABLE "Availability" ALTER COLUMN "schedulingRule" DROP DEFAULT;
ALTER TABLE "Availability" ALTER COLUMN "schedulingRule" TYPE "SchedulingRule_new" USING ("schedulingRule"::text::"SchedulingRule_new");
ALTER TYPE "SchedulingRule" RENAME TO "SchedulingRule_old";
ALTER TYPE "SchedulingRule_new" RENAME TO "SchedulingRule";
DROP TYPE "SchedulingRule_old";
ALTER TABLE "Availability" ALTER COLUMN "schedulingRule" SET DEFAULT 'CONTINUOUS';
COMMIT;

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT true;
