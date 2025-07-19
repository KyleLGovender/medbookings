/*
  Warnings:

  - You are about to drop the column `serviceProviderTypeId` on the `ServiceProvider` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceProvider" DROP CONSTRAINT "ServiceProvider_serviceProviderTypeId_fkey";

-- DropColumn
ALTER TABLE "ServiceProvider" DROP COLUMN "serviceProviderTypeId";