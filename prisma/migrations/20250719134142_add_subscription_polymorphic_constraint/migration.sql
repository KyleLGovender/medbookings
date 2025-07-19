-- Add constraint to ensure exactly one of organizationId, locationId, or serviceProviderId is set
ALTER TABLE "Subscription" 
ADD CONSTRAINT "subscription_polymorphic_constraint" 
CHECK ((("organizationId" IS NOT NULL)::int + ("locationId" IS NOT NULL)::int + ("serviceProviderId" IS NOT NULL)::int) = 1);