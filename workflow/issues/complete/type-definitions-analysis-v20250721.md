# Type Definition Pattern Analysis - MedBookings Features

## Overview

This document provides a comprehensive analysis of type definition patterns across all features in the `/src/features/` directory to identify inconsistencies and recommend a standardized approach aligned with the bulletproof-react structure.

## Executive Summary

After analyzing all features in the codebase, there are significant inconsistencies in type definition patterns:

- **Mixed Type Sources**: Some features heavily use `@prisma/client` types while others define custom interfaces
- **Inconsistent Import Patterns**: Cross-feature imports are inconsistent and sometimes circular
- **Varying Type Complexity**: Some features have comprehensive type systems while others are minimal
- **Missing Type Exports**: Some features don't properly export their types through index files

## Detailed Analysis by Feature

### 1. Admin Feature (`/src/features/admin/`)

**Type Organization**: ✅ **Well-structured**

- **Files**: `enums.ts`, `interfaces.ts`, `schemas.ts`, `types.ts`, `index.ts`
- **Index Export**: ✅ Properly re-exports all types

**Prisma Client Usage**:

```typescript
import { Prisma } from '@prisma/client';

// Extensive use of Prisma select types
export type AdminOrganizationSelect = Prisma.OrganizationGetPayload<{
  include: { approvedBy: true; memberships: true /* ... */ };
}>;
```

**Custom Types**: Comprehensive custom interfaces for API responses, form data, and component props

**Cross-Feature Dependencies**: ❌ **Issues Found**

- Imports from `@/features/providers/hooks/` instead of using types
- Should import types from provider feature types directory

### 2. Organizations Feature (`/src/features/organizations/`)

**Type Organization**: ⚠️ **Inconsistent**

- **Files**: Only `types.ts` (missing enums, interfaces, schemas separation)
- **Index Export**: ❌ Missing index.ts file

**Prisma Client Usage**:

```typescript
import type {
  Organization,
  OrganizationProviderConnection,
  ProviderInvitation,
  ProviderInvitationStatus,
  User,
} from '@prisma/client';

// Direct re-export of Prisma types
export type { ProviderInvitation, ProviderInvitationStatus };
```

**Custom Types**: Well-structured Zod schemas and form validation types

### 3. Providers Feature (`/src/features/providers/`)

**Type Organization**: ❌ **Minimal Structure**

- **Files**: Only `index.ts` (missing separate type files)
- **Index Export**: ✅ Available but incomplete

**Prisma Client Usage**:

```typescript
import type {
  ConnectionStatus,
  Organization,
  OrganizationProviderConnection,
  Provider as PrismaProvider,
  ProviderInvitation,
  ProviderInvitationStatus,
} from '@prisma/client';

// Mixed approach - some extensions, some direct exports
export interface Provider extends PrismaProvider {
  showPrice: boolean; // Custom extension
}
```

**Cross-Feature Dependencies**: ✅ **Properly structured**

- Clear separation between internal types and cross-feature imports

### 4. Calendar Feature (`/src/features/calendar/`)

**Type Organization**: ✅ **Comprehensive**

- **Files**: `schemas.ts`, `types.ts` (but missing enums.ts, interfaces.ts)
- **Index Export**: ❌ Missing

**Prisma Client Usage**:

```typescript
import {
  Organization,
  OrganizationMembership,
  OrganizationProviderConnection,
  User,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
```

**Custom Types**: Extremely comprehensive - 643 lines of well-structured types including complex interfaces for calendar functionality

**Cross-Feature Dependencies**: ✅ **Clean**

```typescript
import { Provider, Service } from '@/features/providers/types';
```

### 5. Communications Feature (`/src/features/communications/`)

**Type Organization**: ⚠️ **Incomplete**

- **Files**: `enums.ts`, `interfaces.ts`, `schemas.ts`, `types.ts` (but mostly empty)
- **Index Export**: ❌ Missing

**Prisma Client Usage**: ❌ **None** - relies on cross-feature imports

**Cross-Feature Dependencies**: ✅ **Appropriate**

```typescript
import { BookingView } from '@/features/calendar/lib/types';
```

### 6. Profile Feature (`/src/features/profile/`)

**Type Organization**: ⚠️ **Basic**

- **Files**: `enums.ts`, `interfaces.ts`, `schemas.ts`, `types.ts`
- **Index Export**: ✅ Available

**Prisma Client Usage**: ❌ **None** - defines custom interfaces that mirror Prisma models

**Custom Types**: Basic but appropriate for simple profile functionality

### 7. Billing Feature (`/src/features/billing/`)

**Type Organization**: ❌ **Empty Structure**

- **Files**: All type files exist but are empty
- **Index Export**: ❌ Missing

### 8. Reviews Feature (`/src/features/reviews/`)

**Type Organization**: ⚠️ **Basic Structure**

- **Files**: `enums.ts`, `interfaces.ts`, `schemas.ts`, `types.ts`
- **Index Export**: ❌ Missing

### 9. Invitations Feature (`/src/features/invitations/`)

**Type Organization**: ❌ **No Types Directory**

- **Files**: No types directory exists
- Components rely on types from other features

## Pattern Analysis

### Current Type Definition Approaches

1. **Prisma-Heavy Approach** (Admin, Organizations)

   - Extensive use of `Prisma.ModelGetPayload<>` types
   - Direct imports from `@prisma/client`
   - Complex select/include patterns

2. **Custom Interface Approach** (Profile, Communications)

   - Define custom interfaces that mirror Prisma models
   - Minimal Prisma client usage
   - More control over exposed properties

3. **Hybrid Approach** (Providers, Calendar)

   - Mix of Prisma types and custom extensions
   - Strategic use of both approaches based on needs

4. **Minimal Approach** (Billing, Invitations)
   - Little to no type definitions
   - Rely on implicit types or cross-feature imports

### Cross-Feature Type Dependencies

**Problematic Patterns**:

```typescript
// ❌ Importing hooks instead of types
// ❌ Circular dependencies potential
import { AdminProviderListSelect } from '@/features/admin/types';
import { useAdminProviders } from '@/features/providers/hooks/use-admin-providers';
```

**Good Patterns**:

```typescript
// ✅ Clean type imports
import { BookingView } from '@/features/calendar/lib/types';
import { Provider, Service } from '@/features/providers/types';
```

## Bulletproof React Alignment Analysis

### Current State vs. Bulletproof React

**Bulletproof React Structure**:

```
features/
  feature-name/
    types/
      index.ts  // Re-export all types
      schemas.ts  // Zod schemas
      types.ts  // Core type definitions
```

**Current Issues**:

1. **Unnecessary Abstraction**: Barrel export files (index.ts) add complexity without benefit
2. **Inconsistent File Structure**: Some features have all files, others are missing key files
3. **Mixed Type Sources**: Inconsistent approach to using Prisma vs custom types
4. **Over-fragmentation**: Splitting types across multiple files (enums.ts, interfaces.ts, types.ts) creates unnecessary complexity

## Recommendations

### 1. Simplified Type Structure (No Barrel Exports)

Each feature should have exactly two files:

```
types/
  schemas.ts    // Zod validation schemas
  types.ts      // ALL TypeScript types, interfaces, enums
```

**Rationale for Simplification**:

- **No index.ts**: Barrel exports add unnecessary abstraction and complexity
- **Single types.ts**: Consolidates interfaces, enums, and types for easier maintenance
- **Direct imports**: `import { Provider } from '@/features/providers/types/types'` is explicit and clear

### 1.1. Standardized File Formatting Pattern

**All `types.ts` and `schemas.ts` files must follow the formatting pattern established in `/src/features/calendar/types/types.ts`:**

```typescript
// =============================================================================
// [FEATURE NAME] TYPES
// =============================================================================
// All type definitions for the [feature name] feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
// External imports first
import { Organization, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Cross-feature imports second
import { Provider, Service } from '@/features/providers/types/types';

// =============================================================================
// ENUMS
// =============================================================================

// Core [feature] enums (matching Prisma schema)
export enum FeatureStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
}

// =============================================================================
// BASE INTERFACES (Client-safe versions of Prisma types)
// =============================================================================

export interface FeatureEntity {
  id: string;
  name: string;
  // ... other fields
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

export interface FeatureWithRelations extends FeatureEntity {
  relatedEntity: RelatedEntity;
  // ... relations
}

// =============================================================================
// PRISMA INCLUDE CONFIGURATIONS
// =============================================================================

// Helper configurations for Prisma queries
export const includeFeatureRelations = {
  relatedEntity: true,
  // ... include config
};

// =============================================================================
// API AND SERVICE TYPES
// =============================================================================

export interface FeatureSearchParams {
  // ... search parameters
}

export interface FeatureApiResponse {
  // ... API response structure
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

export type FeatureContextType = FeatureContext;

// Default configurations
export const getDefaultFeatureConfig = (): FeatureConfig => ({
  // ... default config
});
```

**Required Formatting Rules:**

1. **Header Block**: Feature name and organization description
2. **Import Organization**: External imports first, then cross-feature imports
3. **Section Dividers**: Use `// =============================================================================` format
4. **Section Order**:
   - Enums
   - Base Interfaces
   - Complex Interfaces
   - Prisma Include Configurations
   - API and Service Types
   - Utility Types and Helpers
5. **Comments**: Descriptive comments for each major section
6. **Spacing**: Consistent spacing between sections
7. **Naming**: Descriptive section headers and consistent naming patterns

### 2. Type Source Guidelines

**For Database Entities**:

- ✅ Use Prisma types as base: `import { User, Provider } from '@prisma/client'`
- ✅ Extend when needed: `interface ExtendedProvider extends Provider { customField: string }`
- ✅ Use Prisma select patterns for complex queries: `Prisma.ModelGetPayload<{ include: {...} }>`

**For Business Logic**:

- ✅ Define custom interfaces for API responses, form data, component props
- ✅ Use Zod schemas for validation with inferred types

**For Enums**:

- ✅ Import Prisma enums: `import { UserRole, ProviderStatus } from '@prisma/client'`
- ✅ Define feature-specific enums when needed

### 3. Cross-Feature Import Rules (Direct Imports Only)

```typescript
// ✅ GOOD: Direct, explicit imports
import { Service, Provider } from '@/features/providers/types/types';
import { CreateProviderRequest } from '@/features/providers/types/schemas';
import { UserRole } from '@prisma/client';

// ❌ BAD: Import hooks or components for types
import { useAdminProviders } from '@/features/providers/hooks/use-admin-providers';

// ❌ BAD: No barrel exports (removed index.ts files)
import { Provider } from '@/features/providers/types'; // This won't exist
```

### 4. Benefits of No Barrel Exports

**Performance Benefits**:

- Tree-shaking works perfectly - only imports what's actually used
- Faster TypeScript compilation and build times
- No risk of circular dependencies through barrel files

**Developer Experience Benefits**:

- "Go to Definition" takes you directly to the actual type definition
- Clear visibility of where types come from in import statements
- No maintenance overhead of keeping index.ts files in sync
- Stack traces show actual file locations, not barrel files

**Code Quality Benefits**:

- Explicit dependencies make refactoring safer
- Forces good file organization since paths are visible
- Eliminates hidden complexity of barrel exports

## Implementation Priority

### High Priority (Fix Immediately - 33+ Types)

1. **Move global types to correct locations:**

   - ❌ `/src/lib/types.ts` → `/src/types/api.ts` (ApiResponse type)
   - ❌ `/src/types/calendar.ts` → `/src/features/calendar/types/types.ts` (calendar-specific types)

2. **Move all calendar feature service types (20+ types):**

   - ❌ `/src/features/calendar/lib/types.ts` → `/src/features/calendar/types/types.ts`
   - ❌ `/src/features/calendar/lib/slot-generation.ts` types → types.ts
   - ❌ `/src/features/calendar/lib/availability-validation.ts` types → types.ts
   - ❌ All other calendar lib/\* service types → types.ts

3. **Move providers feature business types (8+ types):**

   - ❌ `/src/features/providers/lib/provider-types.ts` → `/src/features/providers/types/types.ts`
   - ❌ `/src/features/providers/hooks/types.ts` → `/src/features/providers/types/types.ts`

4. **Move organizations feature business types (2+ types):**

   - ❌ `/src/features/organizations/hooks/use-organization-locations.ts` types → types.ts
   - ❌ `/src/features/organizations/hooks/use-provider-connections.ts` types → types.ts

5. **Remove all index.ts barrel export files** from features
6. **Consolidate fragmented type files** - merge enums.ts, interfaces.ts into types.ts
7. **Apply standardized formatting** - all types.ts and schemas.ts files must follow calendar pattern:
   - Header with feature name and organization
   - Proper import organization (external first, cross-feature second)
   - Section dividers with `// =============================================================================`
   - Required section order: Enums → Base Interfaces → Complex Interfaces → Prisma Configs → API Types → Utilities
8. **Complete billing feature types** (currently empty)
9. **Add types directory to invitations feature**
10. **Update all import statements** to use direct imports (300+ files affected)

### Medium Priority (Next Sprint)

11. **Standardize organizations feature** to use simplified structure and formatting
12. **Enhance providers feature** to follow new pattern and formatting
13. **Complete communications feature** type definitions with proper formatting
14. **Refactor existing types.ts files** to match calendar formatting pattern
15. **Create Prisma-derived types** for each feature based on actual usage
16. **Add type validation guards** for critical business types
17. **Create utility types** for common patterns (SearchParams, ApiResult, etc.)

### Low Priority (Future)

18. **Add comprehensive JSDoc** to complex types
19. **Create type validation tests** to ensure consistency
20. **Document direct import guidelines** in CLAUDE.md
21. **Add type-level performance monitoring** for large types
22. **Create automated type organization linting rules**
23. **Create ESLint rules** to enforce formatting standards
24. **Add automated formatting checks** in CI/CD pipeline

## Conclusion

The current type system shows good understanding of TypeScript and Prisma but lacks consistency and has unnecessary complexity from barrel exports and fragmented type files. The recommended simplified approach eliminates abstraction layers while maintaining clear organization.

**Recommended Structure Per Feature**:

```
types/
  schemas.ts  // Zod validation schemas (following calendar pattern)
  types.ts    // ALL TypeScript types, interfaces, enums (following calendar formatting)
```

**Schemas.ts Formatting Pattern**:

```typescript
// =============================================================================
// [FEATURE NAME] SCHEMAS
// =============================================================================
// All Zod validation schemas for the [feature name] feature
// Organized by: Input Schemas -> Response Schemas -> Utility Schemas
import { z } from 'zod';

import { FeatureStatus } from './types';

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

export const createFeatureSchema = z.object({
  name: z.string().min(1),
  // ... validation rules
});

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const featureResponseSchema = z.object({
  id: z.string(),
  // ... response validation
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type CreateFeatureData = z.infer<typeof createFeatureSchema>;
export type FeatureResponse = z.infer<typeof featureResponseSchema>;
```

**Key Benefits of This Approach**:

- **Explicit Imports**: `import { Provider } from '@/features/providers/types/types'` shows exactly where types come from
- **No Abstraction Overhead**: No index.ts files to maintain or debug through
- **Better Performance**: Perfect tree-shaking, faster builds, no circular dependency risks
- **Simplified Maintenance**: Only two files per feature to manage
- **Clear Organization**: All types in one place, schemas separate for validation logic
- **Consistent Formatting**: Standardized structure makes navigation and understanding easier
- **Easier Debugging**: Direct path from import to actual type definition
- **Maintainable Structure**: Clear sections and consistent patterns across all features

## Global Types Analysis (`/src/types/`)

### Current Global Types Directory

**Files Present:**

```
/src/types/
  calendar.ts        // Calendar view enums and interfaces
  next-auth.d.ts     // NextAuth module augmentation
  vcards-js.d.ts     // Third-party library type declarations
```

**Assessment:**

- ✅ **`next-auth.d.ts`** - Correctly placed (global module augmentation)
- ✅ **`vcards-js.d.ts`** - Correctly placed (third-party library types)
- ❌ **`calendar.ts`** - Should move to `/src/features/calendar/types/types.ts`

### What Should Be in `/src/types/`

**Correct Usage - Global Types:**

```typescript
// /src/types/api.ts (move from /src/lib/types.ts)
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

// /src/types/common.ts
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Module Declarations (Keep):**

```typescript
// /src/types/next-auth.d.ts ✅
declare module 'next-auth' { ... }

// /src/types/vcards-js.d.ts ✅
declare module 'vcards-js' { ... }
```

### Types to Move INTO `/src/types/`

1. **`ApiResponse<T>`** from `/src/lib/types.ts` → `/src/types/api.ts` (used across multiple features)
2. **Calendar-specific types** from `/src/types/calendar.ts` → `/src/features/calendar/types/types.ts`

## Inline Type Definitions Analysis

### Comprehensive Search Results

After analyzing the entire codebase for inline type definitions, here are the key findings:

### ✅ **Keep Inline - Correctly Placed Types**

**1. Component Props Interfaces (100+ files)**

```typescript
// Example: /src/features/calendar/components/availability/availability-creation-form.tsx
interface AvailabilityCreationFormProps {
  providerId: string;
  organizationId?: string;
  onSuccess?: (data: AvailabilityWithRelations) => void;
}
```

**Reason:** Component-specific, not shared across modules.

**2. Hook Context Types**

```typescript
// Example: /src/features/calendar/hooks/use-availability.ts
type UpdateAvailabilityContext = {
  previousAvailability: any;
  availabilityId: string;
};
```

**Reason:** TanStack Query internal implementation details, single-use types.

**3. UI Component Extensions**

```typescript
// Example: /src/components/ui/button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
```

**Reason:** Component-specific extensions of base types.

**4. Internal State Management Types**

```typescript
// Example: /src/hooks/use-toast.ts
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};
```

**Reason:** Internal implementation details for state management.

### 🚚 **Move to Feature Types - Misplaced Types**

**1. Service/API Layer Types**

```typescript
// Example: /src/features/calendar/lib/slot-generation.ts
export interface SlotGenerationOptions {
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  // ... more fields
}
```

**Action:** Move to `/src/features/calendar/types/types.ts` (reusable across modules).

**2. Cross-Module Data Interfaces**

```typescript
// Example: /src/features/organizations/hooks/use-organization-locations.ts
export interface OrganizationLocation {
  id: string;
  name: string;
  organizationId: string;
}
```

**Action:** Move to `/src/features/organizations/types/types.ts` (referenced by multiple files).

### 📋 **Rules for Type Placement**

**Keep Types Inline When:**

- Component props interfaces
- Hook-specific context/options (like React Query mutation contexts)
- Internal implementation details
- Single-use, module-specific types
- UI component-specific extensions

**Move to Feature Types When:**

- Used by multiple files in the same feature
- Represent business data models
- API request/response interfaces
- Shared validation schemas
- Service layer contracts

**Move to `/src/types/` When:**

- Used across multiple features
- Global API patterns (`ApiResponse<T>`)
- Third-party module declarations
- Cross-cutting utility types

## COMPREHENSIVE MISPLACED TYPE DEFINITIONS ANALYSIS

### Critical Findings: 33+ Misplaced Types Found

After systematic analysis of the entire codebase, here are ALL misplaced type definitions:

### 1. **GLOBAL TYPES (Move from `/src/lib/` to `/src/types/`)**

#### ❌ `/src/lib/types.ts` (Lines 1-6) → `/src/types/api.ts`

```typescript
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};
```

**Issue**: Cross-cutting utility type used across multiple features should be in global types.

#### ❌ `/src/types/calendar.ts` (Lines 1-20) → `/src/features/calendar/types/types.ts`

```typescript
export const CalendarViewType = {
  slots: 'slots',
} as const;

export const ProviderCalendarViewType = {
  day: 'day',
  week: 'week',
  schedule: 'schedule',
} as const;

export type CalendarViewType = (typeof CalendarViewType)[keyof typeof CalendarViewType];
export type ProviderCalendarViewType =
  (typeof ProviderCalendarViewType)[keyof typeof ProviderCalendarViewType];

export interface TimeRange {
  earliestTime: number;
  latestTime: number;
}
```

**Issue**: Calendar feature-specific types in global directory.

### 2. **CALENDAR FEATURE CRITICAL ISSUES (20+ Types)**

#### ❌ `/src/features/calendar/lib/types.ts` (Lines 3-39) → `/src/features/calendar/types/types.ts`

```typescript
export interface BookingView {
  id: string;
  status: string;
  notificationPreferences: { whatsapp: boolean };
  guestInfo: { name: string; whatsapp?: string };
  slot: {
    // ... extensive booking data model
  };
}
```

**Issue**: Business data model used by multiple files including communications feature.

#### ❌ `/src/features/calendar/lib/slot-generation.ts` (Lines 6-26)

```typescript
export interface SlotGenerationOptions {
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  // ... 15+ fields
}

export interface SlotGenerationResult {
  success: boolean;
  slotsGenerated: number;
  errors?: string[];
}
```

**Issue**: Service layer contracts used by multiple calendar files.

#### ❌ `/src/features/calendar/lib/availability-validation.ts` (Lines 4-15)

```typescript
export interface AvailabilityValidationOptions {
  providerId: string;
  startTime: Date;
  endTime: Date;
  excludeAvailabilityId?: string;
  instances?: Array<{ startTime: Date; endTime: Date }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

**Issue**: Validation contracts used by actions and multiple components.

#### ❌ **Additional Calendar Lib Types (12+ more interfaces):**

- `LocationSearchParams`, `ProviderLocationResult` from `location-search-service.ts`
- `TimeSearchParams`, `TimeFilteredSlot`, `TimeSearchResult` from `time-search-service.ts`
- `WorkflowResult` from `workflow-service.ts`
- `BookingValidationResult`, `SlotBookingRequest` from `booking-integration.ts`
- `CleanupOptions`, `CleanupResult` from `slot-cleanup-service.ts`
- `NotificationPayload`, `AvailabilityNotificationContext` from `notification-service.ts`
- `ServiceFilterParams`, `ServiceFilterResult` from `service-filter-service.ts`
- `ConflictDetectionOptions`, `ConflictResolutionResult` from `conflict-management.ts`
- `SearchPerformanceOptions`, `PerformanceMetrics` from `search-performance-service.ts`

**All Issues**: Service layer contracts scattered across lib files instead of centralized in types.

### 3. **PROVIDERS FEATURE MISPLACED TYPES (8+ Types)**

#### ❌ `/src/features/providers/lib/provider-types.ts` → `/src/features/providers/types/types.ts`

```typescript
export type ProviderTypeData = {
  id: string;
  name: string;
  description: string | null;
};

export type RequirementTypeData = {
  id: string;
  name: string; // ... 8+ fields
};

export type ServiceTypeData = {
  id: string;
  name: string; // ... 6+ fields
};
```

**Issue**: Business data models used by multiple provider components.

#### ❌ `/src/features/providers/hooks/types.ts` (Lines 29-259) → `/src/features/providers/types/types.ts`

**All provider-related business types including:**

- `SupportedLanguage`, `RequirementValidationType` enums
- `SerializedService`, `SerializedProvider` interfaces
- All validation config interfaces (5+ types)
- `RequirementType`, `RequirementSubmission` types
- `ProviderFormType` type

**Issue**: Business logic types incorrectly placed in hooks directory.

### 4. **ORGANIZATIONS FEATURE MISPLACED TYPES (2+ Types)**

#### ❌ `/src/features/organizations/hooks/use-organization-locations.ts` (Lines 3-8)

```typescript
export interface OrganizationLocation {
  id: string;
  name: string;
  organizationId: string;
  [key: string]: any;
}
```

**Issue**: Business data model used by multiple organization files.

#### ❌ `/src/features/organizations/hooks/use-provider-connections.ts` (Lines 3-40)

```typescript
export interface OrganizationProviderConnection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUSPENDED';
  // ... extensive provider connection model
}
```

**Issue**: Business data model representing organization-provider relationships.

### **MISPLACED TYPES SUMMARY**

**High Priority Issues (33+ types):**

- ✅ **Fixed**: `includeAvailabilityRelations` moved to calendar types
- ❌ **Global Types**: 2 types need to move (`ApiResponse` + calendar types)
- ❌ **Calendar Feature**: 20+ service/API types scattered in lib files
- ❌ **Providers Feature**: 8+ business data types in wrong locations
- ❌ **Organizations Feature**: 2+ business data types in hooks

**Architecture Impact:**

- **Performance**: Service types in lib files prevent proper tree-shaking
- **Maintainability**: Business types scattered across multiple directories
- **Developer Experience**: Hard to find and import the right types
- **Code Quality**: Circular dependency risks from misplaced types
- **Consistency**: Inconsistent formatting makes codebase harder to navigate
- **Onboarding**: New developers struggle with scattered, poorly organized types

**Formatting Standard Established:**
The `/src/features/calendar/types/types.ts` file demonstrates the gold standard for type organization with clear sections, proper comments, and logical grouping that should be replicated across all features.
