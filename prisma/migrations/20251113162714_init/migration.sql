-- AlterTable
ALTER TABLE "_AvailabilityToServiceAvailabilityConfig" ADD CONSTRAINT "_AvailabilityToServiceAvailabilityConfig_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AvailabilityToServiceAvailabilityConfig_AB_unique";

-- AlterTable
ALTER TABLE "_ProviderToService" ADD CONSTRAINT "_ProviderToService_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProviderToService_AB_unique";
