# Prisma Type Import Migration Guide

## Overview

This document outlines the migration from manually duplicated enums and types to direct Prisma imports. This eliminates type drift, reduces maintenance overhead, and ensures perfect synchronization between database schema and application types.

## Core Principle

**Before**: Manual enum duplication in `/src/features/*/types/types.ts`
**After**: Direct imports from `@prisma/client`

## Migration Strategy

### ✅ Types to Import from Prisma

The following enums and types should be imported directly from `@prisma/client` and removed from manual type files:

#### Admin Feature
- `AdminApprovalStatus` → Import from Prisma
- `AdminActionType` → Import from Prisma  
- `UserRole` → Import from Prisma

#### Billing Feature
- `BillingStatus` → Import from Prisma
- `PaymentStatus` → Import from Prisma
- `SubscriptionStatus` → Import from Prisma
- `SubscriptionTier` → Import from Prisma
- `BillingPeriod` → Import from Prisma

#### Calendar Feature
- `AvailabilityStatus` → Import from Prisma
- `BookingStatus` → Import from Prisma
- `RecurrenceFrequency` → Import from Prisma
- `DayOfWeek` → Import from Prisma
- `AvailabilityType` → Import from Prisma
- `SlotStatus` → Import from Prisma

#### Communications Feature
- `CommunicationType` → Import from Prisma
- `NotificationStatus` → Import from Prisma
- `NotificationChannel` → Import from Prisma

#### Organizations Feature
- `OrganizationStatus` → Import from Prisma
- `OrganizationRole` → Import from Prisma
- `OrganizationBillingModel` → Import from Prisma
- `MembershipStatus` → Import from Prisma
- `InvitationStatus` → Import from Prisma

#### Profile Feature
- `UserRole` → Import from Prisma (same as Admin)
- `AccountProvider` → Import from Prisma

#### Providers Feature
- `ProviderStatus` → Import from Prisma
- `RequirementsValidationStatus` → Import from Prisma
- `RequirementValidationType` → Import from Prisma
- `Languages` → Import from Prisma
- `RequirementSubmissionStatus` → Import from Prisma

#### Reviews Feature
- `ReviewStatus` → Import from Prisma
- `ReviewRating` → Import from Prisma

### ❌ Types to Keep as Manual Definitions

The following types should remain as manual definitions because they represent client-side concepts, business logic, or calculations that don't exist in the database:

#### Domain Logic Types
- Form state interfaces (e.g., `ProviderFormState`, `OrganizationFormData`)
- Calculated types (e.g., `ServiceConfigCalculation`, `AvailabilityStats`)
- UI state types (e.g., `CalendarViewMode`, `FilterOptions`)
- Business logic types (e.g., `PriceCalculation`, `SlotAvailability`)
- Validation result types (e.g., `ValidationError`, `FormErrors`)

#### Client-Only Enums
- Display modes (e.g., `ViewMode`, `SortOrder`)
- UI states (e.g., `LoadingState`, `FormStep`)
- Client-side filters (e.g., `DateRange`, `SearchScope`)

#### Form Schemas (Zod)
- All Zod schemas remain in `schemas.ts` files
- These define user input validation rules
- They often compose Prisma enums but add validation logic

#### Type Guards
- All type guard functions remain in `guards.ts` files
- These provide runtime type checking
- They often check for Prisma enum values

## Implementation Pattern

### Before (Manual Duplication)
```typescript
// src/features/providers/types/types.ts
export enum ProviderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

// Component usage
import { ProviderStatus } from '@/features/providers/types/types';
```

### After (Direct Import)
```typescript
// Component or hook usage
import { ProviderStatus } from '@prisma/client';

// No manual enum definition needed!
```

### Mixed Usage Pattern
```typescript
// When you need Prisma types AND domain logic types
import { 
  ProviderStatus,
  RequirementsValidationStatus 
} from '@prisma/client';

import { 
  ProviderFormState,  // Keep: Client-only type
  ServiceConfigCalculation  // Keep: Business logic type
} from '@/features/providers/types/types';
```

## Migration Checklist by Feature

### Admin Feature (`/src/features/admin/types/`)
- [ ] Remove `AdminApprovalStatus` enum from types.ts
- [ ] Remove `AdminActionType` enum from types.ts
- [ ] Update all imports to use `@prisma/client`
- [ ] Keep form state interfaces and business logic types

### Billing Feature (`/src/features/billing/types/`)
- [ ] Remove all Prisma enums from types.ts/enums.ts
- [ ] Update all imports to use `@prisma/client`
- [ ] Keep pricing calculation types
- [ ] Keep subscription management interfaces

### Calendar Feature (`/src/features/calendar/types/`)
- [ ] Remove all availability and booking enums
- [ ] Update all imports to use `@prisma/client`
- [ ] Keep calendar view state types
- [ ] Keep availability calculation types

### Organizations Feature (`/src/features/organizations/types/`)
- [ ] Remove organization status and role enums
- [ ] Update all imports to use `@prisma/client`
- [ ] Keep organization form interfaces
- [ ] Keep membership management types

### Providers Feature (`/src/features/providers/types/`)
- [ ] Remove provider status and requirement enums
- [ ] Update all imports to use `@prisma/client`
- [ ] Keep provider form state types
- [ ] Keep service configuration calculations

## Benefits

1. **Zero Type Drift**: Database changes automatically reflected in TypeScript
2. **Reduced Maintenance**: No manual enum updates needed
3. **Single Source of Truth**: Prisma schema is the only enum definition
4. **Better IntelliSense**: Direct connection to database schema
5. **Compile-Time Safety**: TypeScript catches schema mismatches immediately

## Common Patterns

### Importing Multiple Enums
```typescript
import { 
  ProviderStatus,
  RequirementsValidationStatus,
  RequirementValidationType,
  Languages 
} from '@prisma/client';
```

### Using in Zod Schemas
```typescript
import { z } from 'zod';
import { ProviderStatus } from '@prisma/client';

const providerSchema = z.object({
  status: z.nativeEnum(ProviderStatus),
  // ... other fields
});
```

### Using in Type Guards
```typescript
import { ProviderStatus } from '@prisma/client';

export function isPendingProvider(status: unknown): status is ProviderStatus {
  return status === ProviderStatus.PENDING_APPROVAL;
}
```

## Migration Priority

1. **High Priority**: Features with active development (Providers, Calendar, Organizations)
2. **Medium Priority**: Stable features (Admin, Profile, Billing)
3. **Low Priority**: Features with minimal usage (Reviews, Communications)

## Validation Steps

After migration, ensure:
1. TypeScript compilation succeeds with no errors
2. All enum values match database schema exactly
3. No duplicate enum definitions remain
4. All imports point to `@prisma/client`
5. Application functionality remains unchanged