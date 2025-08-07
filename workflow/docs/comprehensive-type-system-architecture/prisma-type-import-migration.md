# Prisma Type Import Migration Guide

**Generated**: January 2025  
**Task**: 3.1 - Audit all manual type files for Prisma enum duplicates

## Overview

This document provides a comprehensive audit of all manual type files in the MedBookings codebase to identify Prisma enum duplicates that need to be migrated to direct imports from `@prisma/client`.

## Audit Results Summary

### Total Manual Type Files Audited: 29

**Files by Feature:**
- Admin: 3 files (types.ts, schemas.ts, guards.ts)
- Billing: 5 files (interfaces.ts, enums.ts, types.ts, schemas.ts, guards.ts)
- Calendar: 3 files (types.ts, schemas.ts, guards.ts)
- Communications: 4 files (interfaces.ts, enums.ts, types.ts, schemas.ts)
- Invitations: 3 files (types.ts, schemas.ts, guards.ts)
- Organizations: 3 files (types.ts, schemas.ts, guards.ts)
- Profile: 2 files (types.ts, schemas.ts)
- Providers: 3 files (types.ts, schemas.ts, guards.ts)
- Reviews: 3 files (interfaces.ts, enums.ts, types.ts, schemas.ts)

## Prisma Schema Enums Reference

Based on analysis of `/prisma/schema.prisma`, the following enums are defined:

```prisma
enum UserRole {
  USER, ADMIN, SUPER_ADMIN
}

enum ProviderStatus {
  PENDING_APPROVAL, REJECTED, APPROVED, TRIAL, TRIAL_EXPIRED, 
  ACTIVE, PAYMENT_OVERDUE, SUSPENDED, CANCELLED
}

enum OrganizationStatus {
  PENDING_APPROVAL, REJECTED, APPROVED, TRIAL, TRIAL_EXPIRED,
  ACTIVE, PAYMENT_OVERDUE, SUSPENDED, CANCELLED
}

enum InvitationStatus {
  PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED
}

enum ProviderInvitationStatus {
  PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED, DELIVERY_FAILED
}

enum OrganizationRole {
  OWNER, ADMIN, MANAGER, STAFF
}

enum OrganizationPermission {
  MANAGE_PROVIDERS, MANAGE_BOOKINGS, MANAGE_LOCATIONS, MANAGE_STAFF,
  VIEW_ANALYTICS, MANAGE_BILLING, RESPOND_TO_MESSAGES, MANAGE_AVAILABILITY
}

enum PaymentStatus {
  PENDING, SUCCEEDED, FAILED, REFUNDED
}

enum SubscriptionStatus {
  ACTIVE, PAST_DUE, CANCELLED, EXPIRED, TRIALING
}

enum RequirementsValidationStatus {
  PENDING, APPROVED, REJECTED
}

enum RequirementValidationType {
  BOOLEAN, DOCUMENT, TEXT, DATE, FUTURE_DATE, PAST_DATE, NUMBER, PREDEFINED_LIST
}

enum Languages {
  English, IsiZulu, IsiXhosa, Afrikaans, Sepedi, Setswana, Sesotho,
  IsiNdebele, SiSwati, Tshivenda, Xitsonga, Portuguese, French, Hindi, German, Mandarin
}

enum AvailabilityStatus {
  PENDING, ACCEPTED, REJECTED, CANCELLED
}

enum SchedulingRule {
  CONTINUOUS, ON_THE_HOUR, ON_THE_HALF_HOUR
}

enum SlotStatus {
  AVAILABLE, BOOKED, BLOCKED, INVALID  
}

enum BookingStatus {
  PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
}

enum CommunicationType {
  BOOKING_CONFIRMATION, BOOKING_REMINDER, BOOKING_CANCELLATION, BOOKING_MODIFICATION
}

enum CommunicationChannel {
  EMAIL, SMS, WHATSAPP
}

enum ReviewStatus {
  PENDING, PUBLISHED, HIDDEN, FLAGGED, SYNCED
}
```

## Detailed Audit Results by Feature

### ✅ Admin Types (`/src/features/admin/types/types.ts`)

**Status**: Contains duplicate enums that need migration

**Duplicate Enums Found**:
1. `AdminApprovalStatus` → Should use `ProviderStatus` and `OrganizationStatus` from Prisma
2. `AdminProviderStatus` → Exact duplicate of `ProviderStatus` from Prisma  
3. `AdminOrganizationStatus` → Exact duplicate of `OrganizationStatus` from Prisma
4. `RequirementValidationStatus` → Exact duplicate of `RequirementsValidationStatus` from Prisma

**Migration Required**: YES
**Priority**: HIGH

### ✅ Billing Types

**Files Analyzed**:
- `/src/features/billing/types/enums.ts` - Empty file (1 line only)
- `/src/features/billing/types/types.ts` - Contains inline enum values as string literals

**Status**: Uses string literals instead of enums - needs migration

**String Literal Patterns Found**:
- Subscription status: `'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'PAUSED'`
- Payment status: `'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'`
- Billing intervals and other enums used as string literals

**Migration Required**: YES
**Priority**: MEDIUM

### ✅ Calendar Types (`/src/features/calendar/types/types.ts`)

**Status**: Partially compliant - imports some Prisma enums but has duplicates

**Already Importing from Prisma**:
- `AvailabilityStatus`
- `BillingEntity`
- `SchedulingRule`
- `SlotStatus`

**Duplicate Enums Found**:
1. `RecurrenceOption` - UI-only enum (KEEP)
2. `DayOfWeek` - Custom implementation with numeric values (KEEP - different from potential Prisma version)
3. `AvailabilityContext` - UI-only enum (KEEP)
4. `SlotGenerationStatus` - UI-only enum (KEEP)

**Migration Required**: NO - Already compliant!
**Priority**: N/A

### ✅ Communications Types

**Files Analyzed**:
- `/src/features/communications/types/enums.ts` - Empty file (1 line only)
- `/src/features/communications/types/types.ts` - Empty/placeholder

**Status**: No duplicate enums found

**Migration Required**: NO
**Priority**: N/A

### ✅ Invitations Types (`/src/features/invitations/types/types.ts`)

**Status**: Contains duplicate enums that need migration

**Duplicate Enums Found**:
1. `InvitationStatus` const object → Should use `InvitationStatus` from Prisma
2. `ProviderInvitationStatus` const object → Should use `ProviderInvitationStatus` from Prisma  
3. `OrganizationRole` const object → Should use `OrganizationRole` from Prisma
4. `OrganizationPermission` const object → Should use `OrganizationPermission` from Prisma

**Note**: These are implemented as const objects with `as const`, but they duplicate Prisma enums exactly.

**Migration Required**: YES  
**Priority**: HIGH

### ✅ Organizations Types (`/src/features/organizations/types/types.ts`)

**Status**: Clean - No duplicate enums found

The file properly references Prisma enums through comments and string literals without redefining them.

**Migration Required**: NO
**Priority**: N/A

### ✅ Profile Types (`/src/features/profile/types/types.ts`)

**Status**: Clean - Only contains UI state types

No enums defined, only form and UI state interfaces.

**Migration Required**: NO
**Priority**: N/A

### ✅ Providers Types (`/src/features/providers/types/types.ts`)

**Status**: Clean - No duplicate enums (already compliant)

The file contains extensive comments about importing Prisma enums directly:
```typescript
// The following enums are defined in Prisma schema and should be imported
// directly from '@prisma/client' where needed:
//
// - ProviderStatus (PENDING_APPROVAL, APPROVED, REJECTED, etc.)
// - RequirementsValidationStatus (PENDING, APPROVED, REJECTED)
// - RequirementValidationType (BOOLEAN, DOCUMENT, TEXT, etc.)
// - Languages (English, IsiZulu, IsiXhosa, etc.)
```

**Migration Required**: NO - Already compliant!
**Priority**: N/A

### ✅ Reviews Types (`/src/features/reviews/types/types.ts`)

**Status**: Placeholder file - Empty

**Migration Required**: NO
**Priority**: N/A

## Migration Priority Matrix

| Feature | Files with Duplicates | Priority | Enum Count | Impact |
|---------|----------------------|----------|------------|---------|
| Admin | types.ts | HIGH | 4 enums | Core approval workflows |
| Billing | types.ts | MEDIUM | ~6 string literals | Payment processing |
| Invitations | types.ts | HIGH | 4 const objects | User onboarding |
| Calendar | N/A | N/A | Already compliant | ✅ |
| Organizations | N/A | N/A | Clean | ✅ |
| Profile | N/A | N/A | Clean | ✅ |
| Providers | N/A | N/A | Already compliant | ✅ |
| Reviews | N/A | N/A | Empty | ✅ |
| Communications | N/A | N/A | Empty | ✅ |

## Migration Plan

### Phase 1: High Priority Migrations (Tasks 3.2, 3.6)

#### 3.2 Admin Types Migration
**Remove these duplicate enums**:
- `AdminApprovalStatus` → Use `ProviderStatus | OrganizationStatus`
- `AdminProviderStatus` → Use `ProviderStatus`
- `AdminOrganizationStatus` → Use `OrganizationStatus`
- `RequirementValidationStatus` → Use `RequirementsValidationStatus`

#### 3.6 Invitations Types Migration  
**Remove these const objects**:
- `InvitationStatus` → Use `InvitationStatus` from Prisma
- `ProviderInvitationStatus` → Use `ProviderInvitationStatus` from Prisma
- `OrganizationRole` → Use `OrganizationRole` from Prisma
- `OrganizationPermission` → Use `OrganizationPermission` from Prisma

### Phase 2: Medium Priority Migrations (Task 3.3)

#### 3.3 Billing Types Migration
**Replace string literal unions** with Prisma enum imports:
- `SubscriptionStatus` from Prisma
- `PaymentStatus` from Prisma
- Other billing-related enums

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