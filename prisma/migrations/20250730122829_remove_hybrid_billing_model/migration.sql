/*
  Warnings:

  - The values [HYBRID] on the enum `OrganizationBillingModel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationBillingModel_new" AS ENUM ('CONSOLIDATED', 'PER_LOCATION');
ALTER TABLE "Organization" ALTER COLUMN "billingModel" DROP DEFAULT;
ALTER TABLE "Organization" ALTER COLUMN "billingModel" TYPE "OrganizationBillingModel_new" USING ("billingModel"::text::"OrganizationBillingModel_new");
ALTER TYPE "OrganizationBillingModel" RENAME TO "OrganizationBillingModel_old";
ALTER TYPE "OrganizationBillingModel_new" RENAME TO "OrganizationBillingModel";
DROP TYPE "OrganizationBillingModel_old";
ALTER TABLE "Organization" ALTER COLUMN "billingModel" SET DEFAULT 'CONSOLIDATED';
COMMIT;
