# tRPC Type Extraction Guide - Option C Architecture

**Version**: 2.0 (Updated for Option C)  
**Last Updated**: 2025-08-04  
**Purpose**: Comprehensive guide for extracting types from tRPC RouterOutputs with efficient Option C patterns

## Option C Architecture Overview

**MedBookings uses Option C architecture for optimal performance and type safety:**

- ✅ **tRPC procedures perform ALL database queries directly** for automatic type inference
- ✅ **Server actions handle ONLY business logic** (validation, notifications, workflows)  
- ✅ **Single database query per endpoint** eliminates duplicate queries
- ✅ **Server actions return minimal metadata only** (IDs, success flags, error messages)
- ✅ **Zero type drift** through automatic Prisma → tRPC → Client type inference

This ensures maximum performance with zero type maintenance overhead.

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [Core Concepts](#core-concepts)
3. [Basic Type Extraction](#basic-type-extraction)
4. [Advanced Patterns](#advanced-patterns)
5. [Common Scenarios](#common-scenarios)
6. [Migration Examples](#migration-examples)
7. [Troubleshooting](#troubleshooting)

## Quick Reference

```typescript
// Import RouterOutputs
import { type RouterOutputs } from '@/utils/api';

// Extract procedure output
type ProcedureOutput = RouterOutputs['routerName']['procedureName'];

// Extract array item
type ArrayItem = RouterOutputs['routerName']['getAll'][number];

// Extract nested field
type NestedField = NonNullable<RouterOutputs['routerName']['get']>['fieldName'];

// Extract optional field
type OptionalField = NonNullable<RouterOutputs['routerName']['get']>['optionalField'];
```

## Core Concepts

### Dual-Source Architecture

MedBookings uses two distinct type sources:

1. **Manual Types** (`/features/*/types/`)
   - Domain enums
   - Form schemas
   - Business logic
   - Type guards
   - Client-only types

2. **tRPC Types** (`RouterOutputs`)
   - Server data
   - API responses
   - Database entities
   - Procedure outputs

### When to Use Each

| Use Case | Type Source | Example |
|----------|------------|---------|
| Server data from API | RouterOutputs | `RouterOutputs['admin']['getProvider']` |
| Domain enums | Manual types | `import { AdminApprovalStatus } from '@/features/admin/types/types'` |
| Form validation | Manual types | `import { rejectionReasonSchema } from '@/features/admin/types/schemas'` |
| Database query results | RouterOutputs | `RouterOutputs['providers']['getAll']` |
| Business calculations | Manual types | `import { calculateOverage } from '@/features/billing/types/types'` |

## Basic Type Extraction

### 1. Simple Procedure Output

```typescript
// Hook returns this data
const { data: provider } = api.providers.getById.useQuery({ id: providerId });

// Extract the type in your component
import { type RouterOutputs } from '@/utils/api';

type Provider = RouterOutputs['providers']['getById'];

// Usage in component
function ProviderDetail({ providerId }: { providerId: string }) {
  const { data: provider } = useProvider(providerId);
  //    ↑ TypeScript knows this is Provider | undefined
  
  if (!provider) return <Loading />;
  
  return <div>{provider.name}</div>; // Full type safety!
}
```

### 2. Array Types

```typescript
// For procedures that return arrays
type Providers = RouterOutputs['providers']['getAll'];
type SingleProvider = Providers[number];

// Usage
function ProviderList() {
  const { data: providers } = useProviders();
  
  return (
    <div>
      {providers?.map((provider: SingleProvider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

### 3. Nested Types

```typescript
// For deeply nested types
type ProviderWithRelations = RouterOutputs['providers']['getWithRelations'];
type ProviderType = NonNullable<ProviderWithRelations>['providerType'];
type Services = NonNullable<ProviderWithRelations>['services'];
type SingleService = Services[number];
```

## Advanced Patterns

### 1. Optional Fields

```typescript
// When a field might be null/undefined
type Provider = RouterOutputs['providers']['getById'];
type Organization = NonNullable<Provider>['organization'];
//    ↑ Removes null/undefined from the type
```

### 2. Union Type Extraction

```typescript
// Extract specific union member
type AllStatuses = NonNullable<Provider>['status'];
// If status is 'PENDING' | 'APPROVED' | 'REJECTED', AllStatuses has that type
```

### 3. Conditional Types

```typescript
// Extract types conditionally
type MaybeProvider = RouterOutputs['providers']['getById'];
type ProviderId = MaybeProvider extends { id: infer ID } ? ID : never;
```

### 4. Pick Specific Fields

```typescript
// Extract only certain fields
type ProviderBasic = Pick<
  NonNullable<RouterOutputs['providers']['getById']>,
  'id' | 'name' | 'email'
>;
```

## Common Scenarios

### Scenario 1: Component Props

```typescript
// ❌ OLD: Manual interface
interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    status: string;
    // ... manually maintained
  };
}

// ✅ NEW: tRPC type extraction
import { type RouterOutputs } from '@/utils/api';

type Provider = NonNullable<RouterOutputs['providers']['getAll']>[number];

interface ProviderCardProps {
  provider: Provider;
  onSelect?: (provider: Provider) => void;
}
```

### Scenario 2: Form Handling

```typescript
// Combine server data with domain types
import { type RouterOutputs } from '@/utils/api';
import { updateProviderSchema } from '@/features/providers/types/schemas';
import type { z } from 'zod';

type Provider = RouterOutputs['providers']['getById'];
type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

function EditProviderForm({ provider }: { provider: Provider }) {
  const form = useForm<UpdateProviderInput>({
    resolver: zodResolver(updateProviderSchema),
    defaultValues: {
      name: provider.name,
      email: provider.email,
      // ... map server data to form schema
    },
  });
}
```

### Scenario 3: List Filtering

```typescript
// Use domain enums with server data
import { type RouterOutputs } from '@/utils/api';
import { ProviderStatus } from '@/features/providers/types/types';

type Providers = RouterOutputs['providers']['getAll'];

function filterProviders(
  providers: Providers,
  status: ProviderStatus
): Providers {
  return providers.filter(p => p.status === status);
}
```

## Migration Examples

### Example 1: Admin Provider List

**Before (Manual Types):**
```typescript
// ❌ In types file
export interface AdminProviderListItem {
  id: string;
  name: string;
  email: string;
  status: AdminProviderStatus;
  providerType: {
    id: string;
    name: string;
  };
  requirementSubmissions: Array<{
    id: string;
    status: RequirementValidationStatus;
  }>;
}

// In component
import { AdminProviderListItem } from '@/features/admin/types/types';

function ProviderList({ providers }: { providers: AdminProviderListItem[] }) {
  // ...
}
```

**After (tRPC Types):**
```typescript
// ✅ In component
import { type RouterOutputs } from '@/utils/api';
import { AdminApprovalStatus } from '@/features/admin/types/types'; // Domain enum

type AdminProviders = RouterOutputs['admin']['getProviders'];
type AdminProvider = AdminProviders[number];

function ProviderList() {
  const { data: providers } = api.admin.getProviders.useQuery();
  
  const pendingProviders = providers?.filter(
    (p: AdminProvider) => p.status === AdminApprovalStatus.PENDING_APPROVAL
  );
  
  return (
    <div>
      {pendingProviders?.map((provider: AdminProvider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

### Example 2: Organization Details

**Before:**
```typescript
// ❌ Manual interface
interface OrganizationWithRelations extends Organization {
  locations: Location[];
  memberships: OrganizationMembership[];
  providerConnections: OrganizationProviderConnection[];
}
```

**After:**
```typescript
// ✅ tRPC extraction
type OrganizationDetail = RouterOutputs['organizations']['getDetail'];
type Locations = NonNullable<OrganizationDetail>['locations'];
type Memberships = NonNullable<OrganizationDetail>['memberships'];
type Connections = NonNullable<OrganizationDetail>['providerConnections'];
```

### Example 3: Billing Subscription

**Before:**
```typescript
// ❌ Complex manual type
interface SubscriptionWithPlan {
  id: string;
  status: SubscriptionStatus;
  plan: {
    id: string;
    name: string;
    price: Decimal;
  };
  usageRecords: UsageRecord[];
}
```

**After:**
```typescript
// ✅ Direct extraction
type Subscription = RouterOutputs['billing']['getSubscription'];
type Plan = NonNullable<Subscription>['plan'];
type UsageRecords = NonNullable<Subscription>['usageRecords'];
type SingleUsageRecord = UsageRecords[number];
```

## Troubleshooting

### Issue 1: Type is `any`

**Problem:** RouterOutputs shows as `any`
```typescript
type Provider = RouterOutputs['providers']['getById']; // any
```

**Solution:** Ensure tRPC router is properly typed
```typescript
// In server/api/routers/providers.ts
export const providersRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: { /* ... */ },
      });
    }),
});
```

### Issue 2: Deeply Nested Types

**Problem:** Complex nested extraction
```typescript
// Hard to read
type X = NonNullable<NonNullable<RouterOutputs['a']['b']>['c']>[number]['d'];
```

**Solution:** Break it down
```typescript
type ApiResponse = RouterOutputs['a']['b'];
type CField = NonNullable<ApiResponse>['c'];
type CItem = CField[number];
type DField = CItem['d'];
```

### Issue 3: Optional Chaining in Types

**Problem:** Need to handle nullable relations
```typescript
// This won't work if organization can be null
type OrgName = Provider['organization']['name']; // Error!
```

**Solution:** Use NonNullable
```typescript
type Organization = NonNullable<Provider>['organization'];
type OrgName = NonNullable<Organization>['name'];
// Or use optional chaining in runtime code
const orgName = provider.organization?.name;
```

## Best Practices

1. **Extract types at component level** - Don't create shared type files
2. **Use descriptive names** - `AdminProvider` not `P` or `ProviderType`
3. **Document complex extractions** - Add comments for nested types
4. **Keep it simple** - If extraction is too complex, break it down
5. **Combine with domain types** - Use manual enums with server data

## Quick Migration Checklist

When migrating a component:

- [ ] Remove manual type imports for server data
- [ ] Add `import { type RouterOutputs } from '@/utils/api'`
- [ ] Extract types from RouterOutputs
- [ ] Keep domain type imports (enums, schemas)
- [ ] Update component props to use extracted types
- [ ] Test TypeScript compilation
- [ ] Verify IntelliSense works correctly

---

**Remember:** The goal is zero type drift between server and client. Let tRPC handle the type flow!