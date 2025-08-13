# Developer Onboarding Guide - MedBookings Type System Architecture

**Welcome to MedBookings!** This guide will get you up to speed with our comprehensive type system architecture that ensures zero type drift and optimal performance.

## 🎯 Quick Start (5 minutes)

### The Two-Source Rule

MedBookings uses a **dual-source type safety approach**:

1. **🔄 tRPC Types** for server data (API responses, database entities)
2. **📝 Manual Types** for domain logic (enums, form schemas, business logic)

**Golden Rule**: If the data comes from the server, use tRPC. If it's pure business logic, use manual types.

### Your First Component

```typescript
// ✅ CORRECT: Component using dual-source pattern
import { type RouterOutputs } from '@/utils/api';
import { AdminApprovalStatus } from '@prisma/client'; // Domain enum

// Extract server data types from tRPC
type AdminProvider = RouterOutputs['admin']['getProviderById'];
type AdminProviders = RouterOutputs['admin']['getProviders'];

export function ProviderComponent({ providerId }: { providerId: string }) {
  const { data: provider } = useAdminProvider(providerId);
  
  // Mix server data with domain logic
  const handleStatusUpdate = (newStatus: AdminApprovalStatus) => {
    // Business logic using domain enum + server data
  };
  
  return (
    <div>
      {/* Perfect IntelliSense from server type */}
      <h1>{provider?.user?.name}</h1>
      <p>Status: {provider?.status}</p>
    </div>
  );
}
```

## 🏗️ Architecture Overview

### The Option C Pattern (Implemented Codebase-Wide)

```
Client Component
    ↓ (tRPC hook)
tRPC Procedure 
    ↓ (business logic needed?)
Server Action (business logic only)
    ↓ (return metadata)
tRPC Procedure 
    ↓ (single database query)
Prisma Database
    ↓ (automatic type inference)
Perfect TypeScript Types
```

**Key Benefits**:
- 🚀 **Performance**: Single database query per endpoint
- 🔒 **Type Safety**: Automatic type propagation with zero drift
- 🎯 **Clarity**: Clean separation between business logic and data access

## 📂 Project Structure (Type-Focused)

```
src/
├── server/api/routers/          # 🔄 tRPC procedures (database queries)
├── features/*/hooks/            # 🪝 Thin tRPC wrappers (no type exports)
├── features/*/components/       # 🎨 Components using RouterOutputs extraction
├── features/*/lib/actions.ts    # 📋 Server actions (business logic only)
├── features/*/types/            # 📝 Manual types (domain logic only)
│   ├── types.ts                 # Domain enums, business logic
│   ├── schemas.ts               # Zod validation schemas
│   └── guards.ts                # Type guard functions
└── utils/api.ts                 # 🔧 tRPC client + RouterOutputs/RouterInputs
```

## 🎨 Component Patterns

### Pattern 1: Basic tRPC Type Extraction

```typescript
import { type RouterOutputs } from '@/utils/api';

// Extract types at component level
type Provider = RouterOutputs['providers']['getById'];
type Providers = RouterOutputs['providers']['getAll'];
type SingleProvider = Providers[number]; // Array item type

export function ProviderList() {
  const { data: providers } = useProviders();
  
  return (
    <div>
      {providers?.map((provider: SingleProvider) => (
        <div key={provider.id}>{provider.user?.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Nested Type Extraction

```typescript
import { type RouterOutputs } from '@/utils/api';

type AdminProvider = RouterOutputs['admin']['getProviderById'];
// Handle potentially null relations
type TypeAssignment = NonNullable<AdminProvider>['typeAssignments'][number];
type Service = NonNullable<AdminProvider>['services'][number];

export function ProviderDetail({ providerId }: { providerId: string }) {
  const { data: provider } = useAdminProvider(providerId);
  
  const services = provider?.services?.map((service: Service) => 
    service.name
  );
  
  return <div>{services?.join(', ')}</div>;
}
```

### Pattern 3: Form Input Types

```typescript
import { type RouterInputs } from '@/utils/api';

// Use RouterInputs for form data
type CreateProviderInput = RouterInputs['providers']['create'];
type UpdateAvailabilityInput = RouterInputs['calendar']['update'];

export function ProviderForm() {
  const createMutation = api.providers.create.useMutation();
  
  const onSubmit = async (data: CreateProviderInput) => {
    await createMutation.mutateAsync(data);
  };
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

## 🪝 Hook Patterns

### ✅ Correct Hook Pattern (Thin tRPC Wrapper)

```typescript
// /features/providers/hooks/use-providers.ts
import { api } from '@/utils/api';

export function useProviders(status?: ProviderStatus) {
  return api.providers.getAll.useQuery({ status });
}

export function useProvider(id: string | undefined) {
  return api.providers.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );
}

// ❌ DON'T export types from hooks
// export type Provider = RouterOutputs['providers']['getById'];
```

### ✅ Correct Hook Usage in Components

```typescript
import { useProviders } from '@/features/providers/hooks/use-providers';
import { type RouterOutputs } from '@/utils/api';

// Extract types in the component that needs them
type Providers = RouterOutputs['providers']['getAll'];

export function ProviderList() {
  const { data: providers } = useProviders();
  // providers is automatically typed from tRPC procedure
  
  return <div>{providers?.length} providers found</div>;
}
```

## 🌐 Server-Side Patterns

### tRPC Procedure Pattern

```typescript
// /server/api/routers/providers.ts
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';

export const providersRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Single database query with full relations
      return ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          services: true,
          typeAssignments: { include: { providerType: true } },
        },
      }); // Automatic type inference ✨
    }),
  
  create: protectedProcedure
    .input(createProviderSchema)
    .mutation(async ({ ctx, input }) => {
      // Call server action for business logic
      const result = await createProvider(input);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Single database query with automatic type inference
      return ctx.prisma.provider.findUnique({
        where: { id: result.providerId },
        include: { /* full relations */ },
      });
    }),
});
```

### Server Action Pattern (Business Logic Only)

```typescript
// /features/providers/lib/actions.ts
export async function createProvider(data: CreateProviderInput) {
  // 1. Validation
  const validatedData = validateProviderData(data);
  
  if (!validatedData.isValid) {
    return { success: false, error: validatedData.error };
  }

  // 2. Business logic - notifications, workflows
  await sendProviderRegistrationEmail(data.email);
  await triggerApprovalWorkflow(data.userId);
  
  // 3. Return minimal metadata only (NO database results)
  return { 
    success: true, 
    providerId: data.userId,
    requiresApproval: true 
  };
}
```

## 📝 Manual Type Patterns

### Domain Logic Types (Keep These)

```typescript
// /features/admin/types/types.ts

// ✅ Domain enums and business logic
export enum AdminActionType {
  APPROVE_PROVIDER = 'APPROVE_PROVIDER',
  REJECT_PROVIDER = 'REJECT_PROVIDER',
  SUSPEND_ORGANIZATION = 'SUSPEND_ORGANIZATION',
}

// ✅ Business logic types
export interface ApprovalWorkflowConfig {
  requiresDocumentReview: boolean;
  autoApprovalThreshold: number;
  escalationRules: EscalationRule[];
}

// ✅ Utility types for domain operations
export type AdminFilterOptions = {
  status: AdminApprovalStatus[];
  dateRange: DateRange;
  sortBy: 'createdAt' | 'updatedAt' | 'name';
};
```

### Form Schema Patterns

```typescript
// /features/providers/types/schemas.ts
import { z } from 'zod';
import { ProviderStatus } from '@prisma/client';

export const createProviderSchema = z.object({
  userId: z.string().uuid(),
  bio: z.string().min(10).max(1000),
  whatsapp: z.string().optional(),
  status: z.nativeEnum(ProviderStatus).default('PENDING_APPROVAL'),
});

export type CreateProviderData = z.infer<typeof createProviderSchema>;
```

## 🚫 Anti-Patterns (DON'T DO THIS)

### ❌ Manual Types for Server Data

```typescript
// DON'T create manual interfaces for server data
interface AdminProvider { // ❌ WRONG - creates type drift
  id: string;
  user: { name: string; email: string };
  status: string;
}

// ✅ CORRECT - use tRPC extraction
type AdminProvider = RouterOutputs['admin']['getProviderById'];
```

### ❌ Exporting Types from Hooks

```typescript
// ❌ WRONG - don't export types from hooks
export function useProviders() {
  return api.providers.getAll.useQuery();
}
export type Providers = RouterOutputs['providers']['getAll']; // DON'T DO THIS

// ✅ CORRECT - extract types in components that need them
export function useProviders() {
  return api.providers.getAll.useQuery();
}
```

### ❌ Database Queries in Server Actions

```typescript
// ❌ WRONG - server action with database query
export async function createProvider(data: any) {
  return prisma.provider.create({ data }); // Creates duplicate queries
}

// ✅ CORRECT - business logic only
export async function createProvider(data: any) {
  await sendNotification(data.email);
  return { success: true, providerId: data.id };
}
```

### ❌ Using 'any' with tRPC Data

```typescript
// ❌ WRONG - loses all type safety
const { data: providers } = useProviders();
providers?.map((provider: any) => /* no IntelliSense */);

// ✅ CORRECT - let tRPC provide types
const { data: providers } = useProviders();
providers?.map((provider) => provider.user?.name); // Full IntelliSense
```

## 🔧 Common Development Tasks

### Adding a New Component

1. **Create the component file**:
   ```typescript
   // /features/calendar/components/availability-view.tsx
   import { type RouterOutputs } from '@/utils/api';
   
   // Extract types you need
   type Availability = RouterOutputs['calendar']['getAvailability'];
   
   export function AvailabilityView({ providerId }: { providerId: string }) {
     const { data: availability } = useAvailability(providerId);
     return <div>{availability?.startTime}</div>;
   }
   ```

2. **Create the hook if needed**:
   ```typescript
   // /features/calendar/hooks/use-availability.ts
   import { api } from '@/utils/api';
   
   export function useAvailability(providerId: string | undefined) {
     return api.calendar.getAvailability.useQuery(
       { providerId: providerId || '' },
       { enabled: !!providerId }
     );
   }
   ```

3. **Add tRPC procedure if needed**:
   ```typescript
   // /server/api/routers/calendar.ts
   getAvailability: protectedProcedure
     .input(z.object({ providerId: z.string() }))
     .query(async ({ ctx, input }) => {
       return ctx.prisma.availability.findMany({
         where: { providerId: input.providerId },
         include: { provider: true, slots: true },
       });
     }),
   ```

### Adding Business Logic

1. **Create server action for business logic**:
   ```typescript
   // /features/calendar/lib/actions.ts
   export async function createAvailability(data: CreateAvailabilityData) {
     // Validation
     const validated = validateAvailabilityData(data);
     if (!validated.isValid) {
       return { success: false, error: validated.error };
     }
     
     // Business logic
     await notifyClientsOfAvailability(data.providerId);
     
     return { success: true, availabilityId: data.id };
   }
   ```

2. **Call from tRPC mutation**:
   ```typescript
   // /server/api/routers/calendar.ts
   create: protectedProcedure
     .input(createAvailabilitySchema)
     .mutation(async ({ ctx, input }) => {
       const result = await createAvailability(input);
       
       if (!result.success) {
         throw new Error(result.error);
       }
       
       return ctx.prisma.availability.findUnique({
         where: { id: result.availabilityId },
         include: { provider: true, slots: true },
       });
     }),
   ```

## 🎓 Advanced Patterns

### Optimistic Updates

```typescript
export function useApproveProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.approveProvider.useMutation({
    onMutate: async ({ providerId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviders');
        },
      });

      // Snapshot previous value
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousData;
      let actualKey;
      
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviders')) {
          actualKey = query.queryKey;
          previousData = query.state.data;
          break;
        }
      }

      // Optimistically update
      if (previousData && actualKey) {
        queryClient.setQueryData(actualKey, (old: any) => {
          if (!old) return old;
          return old.map((provider: any) =>
            provider.id === providerId
              ? { ...provider, status: 'APPROVED' }
              : provider
          );
        });
      }

      return { previousData, actualKey };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousData);
      }
      
      if (options?.onError) {
        options.onError(err as Error);
      }
    },

    onSuccess: async (data, variables) => {
      // Invalidate to get fresh data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviders');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}
```

### Complex Type Extraction

```typescript
import { type RouterOutputs } from '@/utils/api';

// Complex nested type extraction
type CompleteBooking = RouterOutputs['calendar']['getBookingWithDetails'];
type BookingSlot = NonNullable<CompleteBooking>['slot'];
type SlotService = NonNullable<BookingSlot>['service'];
type ServiceConfig = NonNullable<BookingSlot>['serviceConfig'];
type SlotProvider = NonNullable<BookingSlot>['availability']['provider'];

export function BookingDetails({ bookingId }: { bookingId: string }) {
  const { data: booking } = useBookingWithDetails(bookingId);
  
  const service = booking?.slot?.service;
  const provider = booking?.slot?.availability?.provider;
  const config = booking?.slot?.serviceConfig;
  
  return (
    <div>
      <h1>{service?.name}</h1>
      <p>Provider: {provider?.user?.name}</p>
      <p>Duration: {config?.durationMinutes} minutes</p>
    </div>
  );
}
```

## 🚀 Performance Tips

1. **Use staleTime for cached data**:
   ```typescript
   const { data: providers } = api.providers.getAll.useQuery(
     {},
     { staleTime: 5 * 60 * 1000 } // 5 minutes
   );
   ```

2. **Enable queries conditionally**:
   ```typescript
   const { data: provider } = api.providers.getById.useQuery(
     { id: providerId || '' },
     { enabled: !!providerId }
   );
   ```

3. **Use parallel queries**:
   ```typescript
   const providerQuery = api.providers.getById.useQuery({ id: providerId });
   const servicesQuery = api.providers.getServices.useQuery({ providerId });
   
   // Both queries run in parallel
   ```

## 🆘 Troubleshooting

### "Property does not exist" TypeScript Error

**Problem**: `Property 'user' does not exist on type 'Provider'`

**Solution**: Check if the tRPC procedure includes the relation:
```typescript
// In your tRPC procedure, make sure you include the relation:
return ctx.prisma.provider.findUnique({
  where: { id: input.id },
  include: { user: true }, // ← Make sure this is included
});
```

### "Cannot find module '@/utils/api'" Import Error

**Solution**: Make sure you're importing from the correct path:
```typescript
import { type RouterOutputs, api } from '@/utils/api'; // ✅ Correct
```

### Type is `any` Instead of Proper Type

**Problem**: tRPC hook returns `any` type

**Solution**: Check that:
1. The tRPC procedure has a return statement
2. The procedure includes the necessary relations
3. You're using the correct procedure name in the hook

### "Hook already exists" Error

**Problem**: Multiple hooks trying to use the same query key

**Solution**: Make sure each hook has unique parameters:
```typescript
const providers = api.providers.getAll.useQuery({ status: 'ACTIVE' });
const pendingProviders = api.providers.getAll.useQuery({ status: 'PENDING' });
```

## 📚 Further Reading

- **Type Extraction Guide**: `/workflow/docs/comprehensive-type-system-architecture/trpc-type-extraction-guide.md`
- **Migration Templates**: `/workflow/docs/comprehensive-type-system-architecture/migration-templates.md`
- **Troubleshooting Guide**: `/workflow/docs/comprehensive-type-system-architecture/troubleshooting-guide.md`
- **Implementation Examples**: `/workflow/docs/comprehensive-type-system-architecture/implementation-success-report.md`

## 🎉 You're Ready!

You now understand MedBookings' type system architecture! Remember the key principles:

1. **🔄 tRPC types for server data** - use `RouterOutputs` extraction
2. **📝 Manual types for domain logic** - keep in `/features/*/types/`
3. **🪝 Thin hooks** - no type exports, just tRPC wrappers
4. **🎯 Single query pattern** - one database query per endpoint
5. **🚀 Business logic in server actions** - return metadata only

Happy coding! 🚀