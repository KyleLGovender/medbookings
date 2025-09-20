-- Migration Script: Create ServiceAvailabilityConfig records for existing providers
-- 
-- This script identifies providers who have services but are missing 
-- ServiceAvailabilityConfig records and creates default configurations
-- based on the Service default values.

-- Step 1: Identify providers missing ServiceAvailabilityConfig records
-- This query shows providers with services but no configurations
SELECT 
  p.id as provider_id,
  p.name as provider_name,
  p.status as provider_status,
  COUNT(DISTINCT s.id) as total_services,
  COUNT(DISTINCT sac.id) as configured_services,
  COUNT(DISTINCT s.id) - COUNT(DISTINCT sac.id) as missing_configs
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
INNER JOIN "Service" s ON pts."B" = s.id
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId" AND s.id = sac."serviceId"
GROUP BY p.id, p.name, p.status
HAVING COUNT(DISTINCT s.id) > COUNT(DISTINCT sac.id)
ORDER BY missing_configs DESC, p.name;

-- Step 2: Show detailed breakdown of which services are missing configs per provider
SELECT 
  p.id as provider_id,
  p.name as provider_name,
  s.id as service_id,
  s.name as service_name,
  s."defaultPrice" as service_default_price,
  s."defaultDuration" as service_default_duration,
  CASE 
    WHEN sac.id IS NOT NULL THEN 'HAS_CONFIG'
    ELSE 'MISSING_CONFIG'
  END as config_status
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
INNER JOIN "Service" s ON pts."B" = s.id
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId" AND s.id = sac."serviceId"
ORDER BY p.name, s.name;

-- Step 3: Migration DML to create missing ServiceAvailabilityConfig records
-- This INSERT statement creates default configurations for all missing records
INSERT INTO "ServiceAvailabilityConfig" (
  id,
  "serviceId",
  "providerId", 
  duration,
  price,
  "isOnlineAvailable",
  "isInPerson",
  "createdAt",
  "updatedAt"
)
SELECT 
  -- Generate CUID for new records (using random string - in production use proper CUID generation)
  CONCAT('cm', LOWER(SUBSTR(MD5(RANDOM()::text), 1, 23))) as id,
  s.id as "serviceId",
  p.id as "providerId",
  COALESCE(s."defaultDuration", 30) as duration,
  COALESCE(s."defaultPrice", 0) as price,
  true as "isOnlineAvailable", -- Default to online available
  false as "isInPerson", -- Default to not in-person unless provider has organization connections
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
INNER JOIN "Service" s ON pts."B" = s.id
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId" AND s.id = sac."serviceId"
WHERE sac.id IS NULL -- Only insert where config doesn't exist
  AND p.status IN ('APPROVED', 'PENDING_APPROVAL'); -- Only for active/pending providers

-- Step 4: Verification query to confirm migration results
-- Run this after the migration to verify all providers now have configs
SELECT 
  p.id as provider_id,
  p.name as provider_name,
  COUNT(DISTINCT s.id) as total_services,
  COUNT(DISTINCT sac.id) as configured_services,
  CASE 
    WHEN COUNT(DISTINCT s.id) = COUNT(DISTINCT sac.id) THEN 'COMPLETE'
    ELSE 'INCOMPLETE'
  END as migration_status
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
INNER JOIN "Service" s ON pts."B" = s.id
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId" AND s.id = sac."serviceId"
WHERE p.status IN ('APPROVED', 'PENDING_APPROVAL')
GROUP BY p.id, p.name
ORDER BY migration_status, p.name;

-- Step 5: Rollback script (if needed)
-- Use this to undo the migration if there are issues
-- 
-- DELETE FROM "ServiceAvailabilityConfig" 
-- WHERE "createdAt" >= '2025-01-26 00:00:00' -- Adjust date as needed
--   AND id LIKE 'cm%'; -- Only delete records created by this migration