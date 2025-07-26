# Provider Service Default Values Not Persisted During Registration

## Issue Summary

When a new provider registers and sets custom price and duration values for services during the registration process, these custom values are not being saved to the database. Instead, the provider profile pages display the system default values from the `Service` table rather than the provider-specific values that should be stored in the `ServiceAvailabilityConfig` table.

## Problem Description

The provider registration flow in `/src/features/providers/lib/actions/register-provider.ts` creates a `Provider` record and establishes many-to-many relationships with `Service` records via the `_ProviderToService` table, but it does not create corresponding `ServiceAvailabilityConfig` records that should store the provider's custom price and duration values.

**Key Issues:**
1. No `ServiceAvailabilityConfig` records are created during provider registration
2. Provider profile pages fall back to displaying `Service.defaultPrice` and `Service.defaultDuration` instead of provider-specific values
3. The edit services page at `/providers/{id}/edit/services` shows "Unable to load provider or services data" error
4. Provider-specific service configurations are completely missing from the database

## Expected vs Actual Behavior

### Expected Behavior
- During registration, when a provider selects services and sets custom price/duration values, `ServiceAvailabilityConfig` records should be created for each selected service
- Provider profile pages should display the custom price/duration from the `ServiceAvailabilityConfig` table
- The edit services page should load existing `ServiceAvailabilityConfig` records or allow creation of new ones
- Custom values should persist and be displayed throughout the application

### Actual Behavior
- No `ServiceAvailabilityConfig` records are created during registration
- Provider profile pages show system default values from the `Service` table
- Edit services page fails to load with "Unable to load provider or services data" error
- All provider-specific pricing/duration configuration is lost

## Reproduction Steps

1. Navigate to the provider registration form
2. Complete the registration process, selecting services and setting custom price/duration values
3. Submit the registration form
4. Navigate to the provider profile page (e.g., `http://localhost:3000/providers/cmdjut9zi0001ja6jhqh3ezd4`)
5. Observe that displayed prices/durations are system defaults, not the custom values entered during registration
6. Navigate to the edit services page (`http://localhost:3000/providers/cmdjut9zi0001ja6jhqh3ezd4/edit/services`)
7. Observe the "Unable to load provider or services data" error

## Affected Users/Scope

**Affected Users:** All newly registered providers who set custom service pricing/duration during registration

**Scope:** 
- Provider registration flow
- Provider profile display pages
- Provider service editing functionality
- Service availability configuration throughout the application

## Impact Assessment

**Severity:** High - Core functionality is broken
**Frequency:** Consistent - Affects all new provider registrations
**Business Impact:** 
- Providers cannot set custom pricing, limiting platform value proposition
- Provider profiles show incorrect pricing information to potential clients
- Undermines trust in the platform's accuracy
- Prevents providers from properly configuring their services

## Error Details

**Database Query Results:**
- Provider ID `cmdjut9zi0001ja6jhqh3ezd4` exists in the `Provider` table
- No records exist in `ServiceAvailabilityConfig` table for this provider
- No records exist in `_ProviderToService` junction table for this provider

**Console Errors:**
- Edit services page shows "Unable to load provider or services data"

## Environment Information

- **Browser:** Any browser
- **User Role:** Service providers during registration
- **Database:** PostgreSQL with Prisma ORM
- **Affected URLs:** 
  - Provider registration form
  - `/providers/{id}` (profile display)
  - `/providers/{id}/edit/services` (service editing)

## Root Cause Analysis

**Primary Cause:** The `registerProvider` server action in `/src/features/providers/lib/actions/register-provider.ts` only creates:
1. The `Provider` record
2. Many-to-many relationships in `_ProviderToService` (lines 102-104)
3. Provider type assignments
4. Requirement submissions

**Missing Logic:** The registration action does not:
1. Extract custom price/duration values from the form data
2. Create `ServiceAvailabilityConfig` records for each selected service
3. Store the provider-specific pricing/duration configuration

**Database Schema Context:**
- `Service` table has `defaultPrice` and `defaultDuration` (system defaults)
- `ServiceAvailabilityConfig` table has `price` and `duration` (provider-specific overrides)
- The application should query `ServiceAvailabilityConfig` first, then fall back to `Service` defaults

## Potential Solutions

### Solution 1: Modify Registration Server Action
**File:** `/src/features/providers/lib/actions/register-provider.ts`

1. Extract service-specific price/duration values from `FormData`
2. After creating the Provider, create `ServiceAvailabilityConfig` records:
```typescript
// After provider creation, create service availability configs
const serviceConfigs = services.map(serviceId => {
  const price = formData.get(`serviceConfigs[${serviceId}][price]`) as string;
  const duration = formData.get(`serviceConfigs[${serviceId}][duration]`) as string;
  
  return {
    serviceId,
    providerId: provider.id,
    price: parseFloat(price),
    duration: parseInt(duration),
    isOnlineAvailable: false, // Set based on form data
    isInPerson: false, // Set based on form data
  };
});

await prisma.serviceAvailabilityConfig.createMany({
  data: serviceConfigs
});
```

### Solution 2: Update Profile Display Logic
**Files:** Provider profile components and queries

1. Modify provider profile queries to prioritize `ServiceAvailabilityConfig` data
2. Implement proper fallback logic to `Service` defaults when configs don't exist
3. Update all display components to use the correct data source

### Solution 3: Fix Edit Services Page
**File:** `/src/features/providers/components/profile/edit-services.tsx`

1. Update the `useProviderTypeServices` hook to handle missing `ServiceAvailabilityConfig` records
2. Implement logic to create configs when they don't exist
3. Ensure proper form initialization with existing or default values

## Workarounds

**Temporary Workaround:** 
1. Manually create `ServiceAvailabilityConfig` records in the database for existing providers:
```sql
INSERT INTO "ServiceAvailabilityConfig" (id, "serviceId", "providerId", duration, price, "isOnlineAvailable", "isInPerson", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  s.id,
  'cmdjut9zi0001ja6jhqh3ezd4',
  s."defaultDuration",
  s."defaultPrice",
  false,
  false,
  now(),
  now()
FROM "Service" s
JOIN "_ProviderToService" ps ON s.id = ps."A"
WHERE ps."B" = 'cmdjut9zi0001ja6jhqh3ezd4';
```

2. Providers can use the edit services page to set their custom values after registration

## Definition of Done

**This issue is resolved when:**

1. ✅ New provider registration creates `ServiceAvailabilityConfig` records with custom price/duration values
2. ✅ Provider profile pages display custom values from `ServiceAvailabilityConfig`, not system defaults
3. ✅ Edit services page loads successfully and shows existing provider configurations
4. ✅ Existing providers without `ServiceAvailabilityConfig` records can access and use the edit services page
5. ✅ All provider service-related functionality works end-to-end
6. ✅ Database queries confirm `ServiceAvailabilityConfig` records are created for new registrations
7. ✅ No regression in existing provider registration functionality

**Acceptance Criteria:**
- Database verification shows `ServiceAvailabilityConfig` records for newly registered providers
- Provider profile pages show correct custom pricing/duration
- Edit services page loads without errors and allows configuration changes
- Form data flows correctly from registration → database → display → editing

---

**Created:** 2025-07-26  
**Priority:** High  
**Estimated Effort:** Medium (2-3 developer days)  
**Dependencies:** None  
**Related Files:**
- `/src/features/providers/lib/actions/register-provider.ts`
- `/src/features/providers/components/profile/edit-services.tsx`  
- Provider profile display components
- Provider service hooks and queries