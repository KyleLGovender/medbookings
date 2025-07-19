-- Add indexes for ServiceProviderTypeAssignment table to optimize queries

-- Index on serviceProviderId for fast lookup of all types assigned to a provider
CREATE INDEX "ServiceProviderTypeAssignment_serviceProviderId_idx" ON "ServiceProviderTypeAssignment"("serviceProviderId");

-- Index on serviceProviderTypeId for fast lookup of all providers with a specific type
CREATE INDEX "ServiceProviderTypeAssignment_serviceProviderTypeId_idx" ON "ServiceProviderTypeAssignment"("serviceProviderTypeId");

-- Composite index for the unique constraint and efficient JOIN operations
CREATE INDEX "ServiceProviderTypeAssignment_serviceProviderId_serviceProviderTypeId_idx" ON "ServiceProviderTypeAssignment"("serviceProviderId", "serviceProviderTypeId");