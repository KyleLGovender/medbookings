-- CreateTable
CREATE TABLE "ServiceProviderTypeAssignment" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "serviceProviderTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderTypeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderTypeAssignment_serviceProviderId_serviceProv_key" ON "ServiceProviderTypeAssignment"("serviceProviderId", "serviceProviderTypeId");

-- AddForeignKey
ALTER TABLE "ServiceProviderTypeAssignment" ADD CONSTRAINT "ServiceProviderTypeAssignment_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderTypeAssignment" ADD CONSTRAINT "ServiceProviderTypeAssignment_serviceProviderTypeId_fkey" FOREIGN KEY ("serviceProviderTypeId") REFERENCES "ServiceProviderType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
