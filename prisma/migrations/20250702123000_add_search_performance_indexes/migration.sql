-- Add performance indexes for availability search optimization

-- ServiceAvailabilityConfig compound index for provider service filtering
CREATE INDEX IF NOT EXISTS "ServiceAvailabilityConfig_provider_active_price_idx" 
ON "ServiceAvailabilityConfig" ("serviceProviderId", "isActive", "price");

-- CalculatedAvailabilitySlot compound index for slot searches
CREATE INDEX IF NOT EXISTS "CalculatedAvailabilitySlot_status_time_service_idx" 
ON "CalculatedAvailabilitySlot" ("status", "startTime", "serviceId");

-- Availability compound index for provider availability lookups
CREATE INDEX IF NOT EXISTS "Availability_provider_status_time_idx" 
ON "Availability" ("serviceProviderId", "status", "startTime");

-- Service compound index for service type filtering
CREATE INDEX IF NOT EXISTS "Service_type_name_idx" 
ON "Service" ("serviceTypeId", "name");

-- ServiceProvider status and type index
CREATE INDEX IF NOT EXISTS "ServiceProvider_status_type_idx" 
ON "ServiceProvider" ("status", "serviceProviderTypeId");

-- CalculatedAvailabilitySlot location and online filtering
CREATE INDEX IF NOT EXISTS "CalculatedAvailabilitySlot_location_online_idx" 
ON "CalculatedAvailabilitySlot" ("locationId", "isOnlineAvailable");

-- Additional time-based indexes for better performance
CREATE INDEX IF NOT EXISTS "CalculatedAvailabilitySlot_endTime_idx" 
ON "CalculatedAvailabilitySlot" ("endTime");

CREATE INDEX IF NOT EXISTS "Availability_endTime_idx" 
ON "Availability" ("endTime");

-- Index for booking status checks
CREATE INDEX IF NOT EXISTS "CalculatedAvailabilitySlot_booking_idx" 
ON "CalculatedAvailabilitySlot" ("bookingId");

-- Location coordinates index for geospatial queries (requires coordinates to be properly typed)
CREATE INDEX IF NOT EXISTS "Location_coordinates_idx" 
ON "Location" USING GIST (("coordinates"));

-- Service name text search index
CREATE INDEX IF NOT EXISTS "Service_name_text_idx" 
ON "Service" USING GIN (to_tsvector('english', "name"));

-- Provider name text search index  
CREATE INDEX IF NOT EXISTS "User_name_text_idx" 
ON "User" USING GIN (to_tsvector('english', "name"));

-- ServiceType name text search index
CREATE INDEX IF NOT EXISTS "ServiceType_name_text_idx" 
ON "ServiceType" USING GIN (to_tsvector('english', "name"));