# ServiceAvailabilityConfig Migration Guide

## Overview

This migration fixes the issue where provider service default values (price and duration) were not being persisted during registration. The solution involves creating `ServiceAvailabilityConfig` records for existing providers who have services but are missing these configurations.

## Issue Description

**Problem**: When providers registered and set custom prices/durations for their services, these values were not being saved to the database. Only the many-to-many relationship between Provider and Service was created, but the custom pricing information was lost.

**Root Cause**: The `registerProvider` server action was not extracting `serviceConfigs` data from FormData and not creating `ServiceAvailabilityConfig` records.

## Solution Implemented

### 1. Registration Flow Fix

- Updated `registerProvider` to extract service configuration data from FormData
- Added logic to create `ServiceAvailabilityConfig` records during registration
- Implemented proper error handling for config creation

### 2. Display Logic Enhancement

- Updated provider profile components to use `ServiceAvailabilityConfig` data with fallbacks
- Added visual indicators for custom vs default pricing
- Enhanced API endpoints to include service configuration data

### 3. Edit Services Page Fix

- Updated form initialization to work with both existing and missing configs
- Fixed server action to create/update `ServiceAvailabilityConfig` records instead of modifying Service defaults
- Added proper cleanup for deselected services

### 4. Data Migration

- Created SQL and TypeScript migration scripts to backfill missing configurations
- Used Service default values as initial configuration values
- Implemented verification queries to ensure migration completeness

## Migration Files

### SQL Migration (`scripts/migrate-service-configs.sql`)

- Comprehensive SQL script with identification, migration, and verification queries
- Includes rollback instructions
- Safe for production use with proper constraints

### TypeScript Migration (`scripts/migrate-service-configs.ts`)

- Node.js script using Prisma for type-safe migration
- Detailed logging and error handling
- Dry-run capability for testing

## Pre-Migration Checklist

1. **Backup Database**: Create a full database backup before running migration
2. **Test on Staging**: Run migration on staging environment first
3. **Verify Current State**: Query to check how many providers need migration:
   ```sql
   SELECT COUNT(*) FROM "Provider" p
   INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
   LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId"
   WHERE sac.id IS NULL AND p.status IN ('APPROVED', 'PENDING_APPROVAL');
   ```

## Migration Execution Options

### Option 1: SQL Script (Recommended for Production)

```bash
# Connect to production database
psql $DATABASE_URL

# Run the migration section of the SQL script
\i scripts/migrate-service-configs.sql
```

### Option 2: TypeScript Script

```bash
# Ensure production environment variables are set
DATABASE_URL=your_production_url
npx ts-node scripts/migrate-service-configs.ts
```

## Post-Migration Verification

### 1. Check Migration Completeness

```sql
-- Should return 0 incomplete migrations
SELECT COUNT(*) as incomplete_migrations FROM (
  SELECT p.id
  FROM "Provider" p
  INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
  INNER JOIN "Service" s ON pts."B" = s.id
  LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId" AND s.id = sac."serviceId"
  WHERE p.status IN ('APPROVED', 'PENDING_APPROVAL')
  GROUP BY p.id
  HAVING COUNT(DISTINCT s.id) > COUNT(DISTINCT sac.id)
) incomplete;
```

### 2. Verify Data Integrity

```sql
-- Check that prices and durations were migrated correctly
SELECT
  sac.id,
  s.name as service_name,
  sac.price as config_price,
  s."defaultPrice" as service_default_price,
  sac.duration as config_duration,
  s."defaultDuration" as service_default_duration
FROM "ServiceAvailabilityConfig" sac
JOIN "Service" s ON sac."serviceId" = s.id
WHERE sac."createdAt" >= CURRENT_DATE -- Only check recently created configs
LIMIT 10;
```

### 3. Test Application Functionality

- Register a new provider with custom service pricing
- Verify prices are displayed correctly on provider profile
- Test editing services for existing providers
- Confirm fallback logic works for providers without configs

## Rollback Plan

If issues are discovered after migration:

```sql
-- Rollback: Delete all ServiceAvailabilityConfig records created by migration
DELETE FROM "ServiceAvailabilityConfig"
WHERE "createdAt" >= 'YYYY-MM-DD HH:MM:SS' -- Use migration timestamp
  AND id LIKE 'cm%'; -- Only delete records created by migration script
```

## Monitoring

After migration, monitor:

- Provider registration success rates
- Service configuration display accuracy
- Edit services functionality
- Database performance (new table has proper indexes)

## Production Deployment Timeline

1. **Week 1**: Deploy code changes to production (no data migration yet)
2. **Week 2**: Run migration during maintenance window
3. **Week 3**: Monitor and verify functionality
4. **Week 4**: Clean up migration scripts and documentation

## Contact

For questions or issues during migration:

- Development Team: Check codebase for implementation details
- Database Team: Review SQL scripts before execution
- Operations Team: Coordinate maintenance windows

## Migration Verification Commands

```sql
-- Before migration: Count providers missing configs
SELECT COUNT(DISTINCT p.id) as providers_missing_configs
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId"
WHERE sac.id IS NULL AND p.status IN ('APPROVED', 'PENDING_APPROVAL');

-- After migration: Should be 0
SELECT COUNT(DISTINCT p.id) as providers_still_missing_configs
FROM "Provider" p
INNER JOIN "_ProviderToService" pts ON p.id = pts."A"
LEFT JOIN "ServiceAvailabilityConfig" sac ON p.id = sac."providerId"
WHERE sac.id IS NULL AND p.status IN ('APPROVED', 'PENDING_APPROVAL');
```
