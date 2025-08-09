# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npx playwright test` - Run Playwright e2e tests

### Database Operations

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open database GUI
- `npx prisma db seed` - Seed database with sample data

### Docker Development

- `docker compose up` - Start PostgreSQL database locally

## Development Workflow

### Task Completion Reporting

- Always display a list of files that were modified once a task is complete explaining briefly what was modified in each file

### Git Workflow

- **Commit changes after completing each subtask** to maintain clear development history
- Create descriptive commit messages that explain what was accomplished
- Use standard co-authored footer for AI-assisted development

## Server Management

- Let the user run the dev server... never start the dev server yourself... just request the user to do it

## Command Execution Policy

- **NEVER execute commands like `npm run build`, `npm run lint`, `npm run format`, or `npm run dev` directly**
- **ALWAYS present the command to the user and ask them to run it**
- **Wait for the user to provide the output/feedback before proceeding**
- **Only run simple file operations and searches directly**

### Commands to Present to User:
- `npm run build` - For checking build/compilation
- `npm run lint` - For linting code 
- `npm run format` - For formatting code
- `npm run dev` - For starting development server
- `npm run test` - For running tests
- Any other npm scripts or long-running processes

## Command Line Usage Guidelines

### Search Commands

- **Use `grep` instead of `find` for file searches** - The Grep tool is more reliable and has better permissions handling
- **Use `rg` (ripgrep) for fast text searches** - Pre-installed and optimized for code searching
- **Avoid complex bash pipelines** - Use dedicated tools (Grep, Glob) when possible

### Examples:
- ✅ Use: `grep -r "pattern" .` or the Grep tool
- ❌ Avoid: `find . -name "*.js" | xargs grep "pattern"`

## Bash Tips

- Prefer `grep` over `find` for searching text within files - it's more efficient and straightforward for text-based searches

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **API Layer**: tRPC for type-safe APIs (with some legacy REST endpoints)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: tRPC + TanStack Query for server state
- **Validation**: Zod schemas for runtime validation
- **Testing**: Playwright for end-to-end testing only

### Type System Architecture ✅ **COMPREHENSIVE TYPE SAFETY STRATEGY**

The MedBookings codebase uses a **dual-source type safety approach** that combines manual domain types with tRPC-inferred API types for complete end-to-end type safety.

#### Core Principle: Clear Type Boundaries

**✅ Manual Types** (`/features/*/types/`) for domain logic and client-side concerns  
**✅ tRPC Types** (`RouterOutputs`) for server data and API responses

#### Type Source Decision Matrix

| Type Category | Source | Example | Pattern |
|--------------|--------|---------|---------|
| **Database Enums** | Prisma | `ProviderStatus`, `AvailabilityStatus` | `import { Status } from '@prisma/client'` |
| **Domain Enums** | Manual | `RecurrenceOption`, `AdminAction` | `/features/*/types/types.ts` |
| **Form Schemas** | Manual + Prisma | `z.nativeEnum(ProviderStatus)` | `/features/*/types/schemas.ts` |
| **Business Logic** | Manual | Complex domain calculations | `/features/*/types/types.ts` |
| **Type Guards** | Manual | Runtime validation | `/features/*/types/guards.ts` |
| **API Responses** | tRPC | Server query results | `RouterOutputs['router']['procedure']` |
| **Database Entities** | tRPC | Prisma query outputs | `RouterOutputs['router']['procedure']` |
| **Server-Derived** | tRPC | Any data from server procedures | `RouterOutputs['router']['procedure']` |

#### Manual Type Organization (`/features/[feature-name]/types/`)

##### File Structure
```
src/features/[feature-name]/types/
├── types.ts          # Domain enums, business logic types, utility types
├── schemas.ts        # Zod validation schemas for forms and user input  
├── guards.ts         # Type guard functions for runtime type checking
```

##### Import Patterns
- ✅ **Direct imports**: `import { Type } from '@/features/calendar/types/types'`
- ❌ **Barrel exports**: `import { Type } from '@/features/calendar/types'` (not allowed)

##### Prisma Type Import Patterns ✅ **ZERO TYPE DRIFT**

**Direct Prisma Enum Imports** - Always import database enums directly from `@prisma/client`:

```typescript
// ✅ CORRECT: Components, hooks, server actions
import { ProviderStatus, AvailabilityStatus, Languages } from '@prisma/client';

// ✅ CORRECT: Zod schemas with native enums
import { z } from 'zod';
import { ProviderStatus } from '@prisma/client';
export const providerStatusSchema = z.nativeEnum(ProviderStatus);

// ❌ WRONG: Never re-export or duplicate Prisma enums
export enum ProviderStatus { PENDING = 'PENDING' } // DON'T DO THIS
```

**Available Prisma Enums:**
- **User**: `UserRole`
- **Provider**: `ProviderStatus`, `Languages`, `RequirementsValidationStatus`, `RequirementValidationType`
- **Organization**: `OrganizationStatus`, `OrganizationRole`, `OrganizationBillingModel`, `MembershipStatus`, `InvitationStatus`
- **Calendar**: `AvailabilityStatus`, `BookingStatus`, `SchedulingRule`, `SlotStatus`
- **Billing**: `SubscriptionStatus`, `PaymentStatus`, `BillingInterval`, `BillingEntity`
- **Communications**: `CommunicationType`, `CommunicationChannel`

##### Manual Type Standards
1. **Domain Enums**: UI-specific enums not in database (`RecurrenceOption`, `AdminAction`)
2. **Form Types**: User input structures with Zod validation
3. **Business Logic Types**: Complex domain calculations and transformations
4. **Utility Types**: Type manipulation for domain-specific needs
5. **Client-Only Types**: UI state, form state, component props

### Project Structure

This is a medical booking platform with a feature-based architecture:

src/
├── app/ # Next.js App Router
│ ├── (dashboard)/ # Dashboard route group (protected)
│ ├── (general)/ # Public route group
│ └── api/ # API routes
├── features/ # Feature modules
│ ├── auth/ # Authentication
│ ├── calendar/ # Booking & availability management
│ ├── providers/ # Service provider management
│ ├── organizations/ # Organization management
│ ├── admin/ # Admin functionality
│ ├── communications/ # Email/SMS notifications
│ ├── billing/ # Billing and pricing
│ ├── profile/ # User profile management
│ └── reviews/ # Review system
├── components/ # Shared UI components
├── lib/ # Shared utilities
└── hooks/ # Shared React hooks

### Feature Module Pattern

Each feature follows a consistent structure:

feature/
├── components/ # Feature-specific components
├── hooks/ # Feature-specific hooks (TanStack Query)
├── lib/ # Actions, queries, helpers
├── types/ # TypeScript types and schemas
└── index.ts # Public API exports

## Domain Model & Entity Relationships

### Core Business Entities

#### User & Authentication

- **User**: Base entity with roles (USER, ADMIN, SUPER_ADMIN)
- **Account**: OAuth accounts (Google, etc.) linked to users
- **Provider**: Healthcare providers offering services (1:1 with User)

#### Service Provider Ecosystem

- **ProviderType**: Categories like "General Practitioner", "Physiotherapist"
- **Service**: Specific services offered (e.g., "Consultation", "X-Ray")
- **ServiceAvailabilityConfig**: Service-specific pricing/duration per provider
- **RequirementType**: Professional requirements (licenses, certifications)
- **RequirementSubmission**: Provider's submitted documents/validations

#### Organization & Location Management

- **Organization**: Healthcare facilities (clinics, hospitals, private practices)
- **Location**: Physical addresses associated with organizations (Google Places integration)
- **OrganizationMembership**: Users' roles within organizations (OWNER, ADMIN, MANAGER, STAFF)
- **OrganizationInvitation**: Invitation system for joining organizations
- **OrganizationProviderConnection**: Links between organizations and service providers

#### Availability & Booking System

- **Availability**: Time blocks when providers are available
- **CalculatedAvailabilitySlot**: Individual bookable time slots (generated from availability)
- **Booking**: Actual appointments made by clients
- **CalendarIntegration**: Google Calendar sync for providers
- **CalendarEvent**: External calendar events that block availability

#### Billing & Subscriptions

- **Subscription**: Platform subscriptions (per provider, organization, or location)
- **SubscriptionPlan**: Pricing tiers with slot-based billing
- **UsageRecord**: Track billable slots for tiered pricing
- **Payment**: Payment records and Stripe integration

### Key Business Rules

#### Provider-Organization Relationships

1. **Independent Providers**: Can only schedule online availability
2. **Organization-Associated Providers**: Can schedule in-person availability at physical locations
3. **Multi-Organization Providers**: Can be associated with multiple organizations
4. **Exclusive Scheduling**: Provider can only have availability with ONE entity at any given time period

#### Availability & Billing Logic

1. **Availability Creation**:
   - Providers create their own availability (self-billed)
   - Organizations propose availability to providers (org-billed after acceptance)
2. **Slot Billing**: Determined by who created the availability
   - Provider-created → Provider's subscription
   - Organization-created → Organization's subscription
3. **Slot-Based Pricing**: Subscriptions include base slots + tiered overage pricing

#### Booking Workflows

1. **Client Discovery**: Clients find and book directly with specific providers
2. **Booking Types**:
   - Registered user bookings (linked to User)
   - Guest bookings (name/contact only)
   - Staff-created bookings (organization members booking for clients)
3. **Confirmation Flow**: Bookings can require provider confirmation based on availability settings

#### Status Management & Approval Workflows

- **Provider**: PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE
- **Organization**: PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE
- **Booking**: PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
- **Availability**: PENDING (org-created) → ACCEPTED (by provider)

**Critical Approval Rules**:

- Provider approval requires ALL requirements approved first
- Rejection reasons are mandatory
- Approval/rejection are mutually exclusive (clear opposite fields)
- Log all admin actions with full context

### Integration Points

#### Google Calendar Integration

- **Bidirectional Sync**: MedBookings ↔ Google Calendar
- **Conflict Detection**: External events block availability slots
- **Meet Integration**: Auto-generate Google Meet links for online bookings
- **Webhook Support**: Real-time sync via Google Calendar push notifications

#### Communication System

- **Multi-Channel**: Email, SMS, WhatsApp notifications
- **Automated Triggers**: Booking confirmations, reminders, cancellations
- **Guest Support**: Communications work for both registered users and guests

## Development Patterns & Standards

### Authentication & Authorization

- **Admin API Routes**: Use `getCurrentUser()` (not `getServerSession`)
- **Role Checking**: Check `['ADMIN', 'SUPER_ADMIN']` roles
- **Error Handling**: Return consistent 401/500 errors
- **Pattern**: `getCurrentUser()` → role check → 401 if unauthorized → try/catch with 500 error handling

### Data Layer Architecture ✅ **EFFICIENT tRPC PATTERN**

- **tRPC API**: Type-safe end-to-end API using tRPC with direct database queries for maximum efficiency
- **Server Procedures**: Located in `/lib/trpc/routers/` - handle ALL database operations directly
- **Business Logic**: Located in `/features/{feature}/lib/actions.ts` (server actions) for validation, notifications, and workflows only
- **Client Hooks**: Located in `/features/{feature}/hooks/` using tRPC + TanStack Query
- **Type Safety**: Full end-to-end type safety from server to client with automatic Prisma inference
- **Legacy REST**: A few exceptions remain as REST API routes in `/app/api/`

#### CRITICAL: Efficient Data Access Pattern

- **Client-side hooks NEVER import Prisma directly**
- **Hooks ONLY call tRPC procedures (or legacy API routes where applicable)**
- **Database queries ONLY in tRPC procedures for automatic type inference**
- **Server actions ONLY for business logic, return minimal metadata**
- **Pattern**: Hook → tRPC Procedure → Prisma (single database query)
- **Business Logic Pattern**: tRPC Procedure → Server Action (for validation/notifications) → Return metadata → tRPC Procedure → Single Prisma Query

#### tRPC Data Flow Examples

```typescript
// ✅ CORRECT: Hook calls tRPC procedure
import { api } from '@/lib/trpc/client'

export const useProviders = () => {
  return api.providers.getAll.useQuery({
    // Optional input parameters
  })
}

// ✅ CORRECT: tRPC procedure queries database directly for automatic type inference
// /lib/trpc/routers/providers.ts
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const providersRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Direct Prisma query for automatic type inference
      return ctx.prisma.provider.findMany({
        take: input?.limit,
        skip: input?.offset,
        include: {
          user: { select: { id: true, name: true, email: true } },
          services: true,
          // Full relations for complete type safety
        }
      })
    }),
})

// ✅ CORRECT: Server action handles business logic only, returns metadata
// /features/providers/lib/actions.ts
export async function createProvider(data: CreateProviderData) {
  // Validation, notifications, business logic
  const validatedData = validateProviderData(data)
  
  if (!validatedData.isValid) {
    return { success: false, error: validatedData.error }
  }

  // Send notifications, trigger workflows, etc.
  await sendProviderRegistrationEmail(data.email)
  
  // Return minimal metadata only
  return { 
    success: true, 
    providerId: data.userId, // Just the ID for tRPC to query
    requiresApproval: true 
  }
}

// ✅ CORRECT: Mutation with business logic + database query
export const useCreateProvider = () => {
  return api.providers.create.useMutation({
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error with full type safety
    },
  })
}

// ✅ CORRECT: tRPC mutation procedure pattern
create: protectedProcedure
  .input(createProviderSchema)
  .mutation(async ({ ctx, input }) => {
    // Call server action for business logic
    const result = await createProvider(input)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    // Single database query with full relations for type safety
    return ctx.prisma.provider.findUnique({
      where: { id: result.providerId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        services: true,
        typeAssignments: { include: { providerType: true } },
        // Complete data with automatic type inference
      }
    })
  })
```

#### Legacy REST API Exceptions

Some endpoints remain as REST APIs in `/app/api/`:
- File uploads (`/api/upload/*`)
- Webhook endpoints
- Third-party integrations
- NextAuth.js routes (`/api/auth/*`)

#### tRPC Type Safety Architecture ✅ **SERVER DATA & API RESPONSES**

**For all server-derived data, the codebase uses tRPC's automatic type inference to ensure zero-drift type safety from server to client. This pattern MUST be followed for all API data.**

##### Pattern Overview: Component-Level Type Extraction

**✅ REQUIRED APPROACH**: Components extract types directly from `RouterOutputs` for all server data.

##### 1. tRPC API Level (Server Procedures)

```typescript
// /server/api/routers/admin.ts
import { adminProcedure, createTRPCRouter } from '@/server/trpc';

export const adminRouter = createTRPCRouter({
  getProviderById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          typeAssignments: { include: { providerType: true } },
          services: true,
        },
      });
      
      if (!provider) {
        throw new Error('Provider not found');
      }
      
      return provider; // ← Return type automatically inferred by tRPC
    }),
    
  getProviders: adminProcedure
    .input(adminSearchParamsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.provider.findMany({
        where: buildWhereClause(input),
        include: { /* ... */ },
      }); // ← Return type automatically inferred
    }),
});
```

**Key Points:**
- Server procedures return Prisma query results directly
- tRPC automatically infers and captures return types
- No manual type definitions needed at server level

##### 2. Hook Level (Simple tRPC Wrappers)

```typescript
// /features/providers/hooks/use-admin-providers.ts
import { api } from '@/utils/api';

// ✅ CORRECT: Keep hooks simple, no type extraction
export function useAdminProvider(providerId: string | undefined) {
  return api.admin.getProviderById.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}

export function useAdminProviders(status?: AdminApprovalStatus) {
  return api.admin.getProviders.useQuery({ status });
}

// ❌ FORBIDDEN: Don't export types from hooks
// export type AdminProvider = RouterOutputs['admin']['getProviderById']; // DON'T DO THIS
```

**Key Points:**
- Hooks are thin wrappers around tRPC queries
- No type exports from hook files
- Components handle their own type extraction

##### 3. Component Level (Type Extraction + Usage)

```typescript
// /features/admin/components/providers/provider-detail.tsx
import { api, type RouterOutputs } from '@/utils/api';

// ✅ CORRECT: Extract types directly from RouterOutputs
type AdminProvider = RouterOutputs['admin']['getProviderById'];
type AdminProviders = RouterOutputs['admin']['getProviders'];
type SingleProvider = AdminProviders[number];
type TypeAssignment = NonNullable<AdminProvider>['typeAssignments'][number];
type Service = NonNullable<AdminProvider>['services'][number];

export function ProviderDetail({ providerId }: { providerId: string }) {
  // Hook returns fully typed data
  const { data: provider, isLoading, error } = useAdminProvider(providerId);
  //    ↑ TypeScript knows this is AdminProvider | undefined
  
  // Full type safety in component logic
  const providerTypes = provider?.typeAssignments?.map((assignment: TypeAssignment) => 
    assignment.providerType?.name
  );
  
  const services = provider?.services?.map((service: Service) => 
    service.name
  );
  
  return (
    <div>
      {/* TypeScript provides full intellisense */}
      <h1>{provider?.user?.name}</h1>
      <p>{provider?.user?.email}</p>
      {providerTypes?.map(type => <Badge key={type}>{type}</Badge>)}
    </div>
  );
}
```

**Key Points:**
- Import `RouterOutputs` from `@/utils/api`
- Extract exact types using bracket notation: `RouterOutputs['router']['procedure']`
- Use `NonNullable<>` for nested types when needed
- Use `[number]` to extract array item types
- Components get full type safety and intellisense

##### 4. Type Extraction Patterns

```typescript
// Basic procedure output
type Output = RouterOutputs['routerName']['procedureName'];

// Array item type
type ArrayItem = RouterOutputs['routerName']['getAll'][number];

// Nested object type (when relation might be null)
type NestedType = NonNullable<Output>['relationName'][number];

// Optional field type
type OptionalField = NonNullable<Output>['optionalField'];

// Union type extraction
type Status = NonNullable<Output>['status']; // Extracts the exact enum/union
```

##### 5. Dual-Source Type Usage Rules

**✅ For Server Data (use tRPC):**
- Extract types in each component that needs them: `RouterOutputs['router']['procedure']`
- Keep hooks simple and focused on data fetching
- Import types directly from tRPC source of truth
- Use for: API responses, database entities, server-derived data

**✅ For Domain Logic (use Manual Types):**
- Import from feature type files: `import { Type } from '@/features/feature/types/types'`
- Use for: Domain enums, form schemas, business logic, type guards
- Keep in `/features/*/types/` files with proper documentation

**❌ DON'T:**
- Re-export types from hook files
- Create manual interfaces that duplicate tRPC server data
- Use `any` types with tRPC data
- Mix manual types for server data (use tRPC instead)
- Use tRPC types for pure domain logic (use manual types instead)

##### 6. Migration Patterns & Examples

**A. Server Data Migration (API responses → tRPC types):**

```typescript
// BEFORE (manual types for server data - ❌ WRONG)
import { AdminProviderListSelect } from '@/features/admin/types/types';
const providers = api.admin.getProviders.useQuery();
providers?.map((provider: AdminProviderListSelect) => /* ... */);

// AFTER (tRPC types for server data - ✅ CORRECT)
import { type RouterOutputs } from '@/utils/api';
type AdminProviders = RouterOutputs['admin']['getProviders'];
type AdminProvider = AdminProviders[number];
const providers = api.admin.getProviders.useQuery();
providers?.map((provider: AdminProvider) => /* ... */);
```

**B. Domain Logic Integration (combine both sources):**

```typescript
// ✅ CORRECT: Mixed usage with clear boundaries
import { AdminApprovalStatus } from '@/features/admin/types/types'; // Domain enum
import { type RouterOutputs } from '@/utils/api'; // Server data

type AdminProvider = RouterOutputs['admin']['getProviderById']; // Server data
type AdminProviders = RouterOutputs['admin']['getProviders']; // Server data

function ProviderComponent({ providerId }: { providerId: string }) {
  const { data: provider } = useAdminProvider(providerId); // provider: AdminProvider
  
  // Mix server data (provider) with domain logic (status enum)
  const handleStatusUpdate = (newStatus: AdminApprovalStatus) => {
    // Business logic using domain enum + server data
  };
}
```

#### Complete Type Safety Implementation Roadmap

##### Phase 1: Audit & Categorize All Types
1. **Identify Server Data Types**: All interfaces that represent API responses or database entities
2. **Identify Domain Types**: All enums, business logic types, form schemas, type guards
3. **Mark for Migration**: Server data types → tRPC, Keep domain types as manual

##### Phase 2: Component-by-Component Migration
1. **Replace server data imports** with tRPC type extraction
2. **Keep domain type imports** from manual type files
3. **Remove redundant manual interfaces** that duplicate server data
4. **Update manual type files** to contain only domain logic

##### Phase 3: Validation & Cleanup
1. **Remove unused manual types** that were migrated to tRPC
2. **Ensure consistent patterns** across all components
3. **Update type documentation** to reflect dual-source approach

**This comprehensive approach ensures:**
- Zero type drift between server and client for API data
- Consistent domain logic representation across features
- Clear boundaries between server and client concerns
- Automatic type updates when server changes
- Maximum type safety and developer experience throughout the application

#### ❌ FORBIDDEN PATTERNS
```typescript
// ❌ NEVER: Duplicate Prisma enums in manual types
export enum ProviderStatus { 
  PENDING = 'PENDING', 
  APPROVED = 'APPROVED' 
} // WRONG! Import from @prisma/client

// ❌ NEVER: Re-export Prisma enums from manual types
import { ProviderStatus } from '@prisma/client';
export { ProviderStatus }; // WRONG! Import directly where used

// ❌ NEVER: Manual enum values in Zod schemas
export const statusSchema = z.enum(['PENDING', 'APPROVED']); // WRONG! Use z.nativeEnum

// ❌ NEVER: Hook importing Prisma directly
import { prisma } from '@/lib/prisma'
export const useProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => prisma.provider.findMany() // WRONG!
  })
}

// ❌ NEVER: Client component importing Prisma
import { prisma } from '@/lib/prisma'
export default function ProvidersPage() {
  // This will cause build errors
}

// ❌ NEVER: Direct fetch calls to REST APIs (use tRPC instead)
export const useProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => fetch('/api/providers').then(res => res.json()) // WRONG! Use tRPC
  })
}

// ❌ NEVER: Server actions returning database results (return metadata only)
export async function getProviders(input?: { limit?: number }) {
  return prisma.provider.findMany({ take: input?.limit }) // WRONG! tRPC should query
}

// ❌ NEVER: tRPC procedures calling server actions for database queries
getAll: publicProcedure.query(async ({ input }) => {
  return await getProviders(input) // WRONG! Query database directly in tRPC
})

// ❌ NEVER: Duplicate database queries
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const result = await createProvider(input) // Server action queries DB
  return ctx.prisma.provider.findUnique({ where: { id: result.id } }) // WRONG! Second query
})

// ❌ NEVER: Export types from hook files
export function useAdminProviders() {
  return api.admin.getProviders.useQuery();
}
export type AdminProviders = RouterOutputs['admin']['getProviders']; // DON'T DO THIS

// ❌ NEVER: Use manual types for server data (use tRPC instead)
import { AdminProviderListSelect } from '@/features/admin/types/types';
const { data: providers } = useAdminProviders();
providers?.map((provider: AdminProviderListSelect) => /* WRONG! Use tRPC types */);

// ❌ NEVER: Use tRPC types for domain logic (use manual types instead)
type MyBusinessLogic = RouterOutputs['admin']['getProviders'][number]['status']; // WRONG! Use domain enum

// ❌ NEVER: Use any types with tRPC data
const { data: providers } = useAdminProviders();
providers?.map((provider: any) => /* WRONG! */);

// ❌ NEVER: Mix sources incorrectly
import { AdminProvider } from '@/features/admin/types/types'; // Manual interface
import { type RouterOutputs } from '@/utils/api';
type MixedWrong = AdminProvider & RouterOutputs['admin']['getProviders'][number]; // WRONG!
```

#### Global Types Structure

##### Manual Global Types (`/src/types/`)
- **`/src/types/api.ts`**: Generic API patterns, error types, pagination
- **`/src/types/guards.ts`**: Common validation functions across features  
- **`/src/types/ui.ts`**: Shared UI component types, theme types

##### tRPC Global Types (`/src/utils/api.ts`)
- **`RouterInputs`**: Input types for all tRPC procedures
- **`RouterOutputs`**: Output types for all tRPC procedures  
- **`api`**: The tRPC client with full type safety

### Form Implementation Patterns

- **Validation**: React Hook Form with Zod schemas
- **Nested Data**: Use `z.record()` for nested structures (not arrays)
- **Complex Fields**: Use Controller pattern for complex form controls
- **State Management**: Components manage local `isSubmitting` state
- **Error Flow**: FormData → mutateAsync with try/catch → UI feedback
- **Selection Forms**: Avoid useFieldArray for simple selection forms

### Optimistic Update Pattern ✅ **CRITICAL FOR UX**

This pattern provides instant UI feedback for mutations while maintaining data integrity through proper error handling and rollback mechanisms. It's extensively used in admin approval workflows and should be adopted for all mutations that update cached data.

#### Why Use Optimistic Updates?

- **Instant Feedback**: Users see changes immediately without waiting for server response
- **Better UX**: Eliminates perceived lag, making the app feel more responsive
- **Graceful Degradation**: Automatically rolls back on error with proper error messages
- **Consistency**: Ensures UI state matches server state through invalidation

#### Pattern Overview

```typescript
// The pattern uses tRPC's mutation hooks with three key phases:
// 1. onMutate - Optimistically update the cache before server request
// 2. onError - Roll back changes if server request fails
// 3. onSuccess - Invalidate queries to fetch fresh data
```

#### Implementation Guide

##### Step 1: Create the Mutation Hook

```typescript
export function useApproveRequirement(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.approveRequirement.useMutation({
    // Step 2: Implement onMutate for optimistic updates
    onMutate: async ({ providerId, requirementId }) => {
      // 2.1: Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderRequirements') && keyStr.includes(providerId);
        },
      });

      // 2.2: Find and snapshot current data
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousData;
      let actualKey;
      
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderRequirements') && keyStr.includes(providerId)) {
          actualKey = query.queryKey;
          previousData = query.state.data;
          break;
        }
      }

      if (!previousData || !actualKey) {
        console.warn('Could not find data to snapshot');
        return { previousData: null, actualKey: null };
      }

      // 2.3: Optimistically update the cache
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((item: any) =>
          item.id === requirementId
            ? {
                ...item,
                status: 'APPROVED',
                validatedAt: new Date().toISOString(),
                // Use placeholder until server responds
                validatedById: 'optimistic',
              }
            : item
        );
      });

      // 2.4: Return context for rollback
      return { previousData, actualKey, providerId };
    },

    // Step 3: Handle errors with rollback
    onError: (err, variables, context) => {
      console.error('Mutation failed, rolling back:', err);
      
      // Roll back to previous state
      if (context?.previousData && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousData);
      }

      // Call user's error handler
      if (options?.onError) {
        options.onError(err as any);
      }
    },

    // Step 4: Handle success with cache invalidation
    onSuccess: async (data, variables) => {
      // Invalidate relevant queries to ensure fresh data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderRequirements') && 
                 keyStr.includes(variables.providerId);
        },
      });

      // Also invalidate related queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviders');
        },
      });

      // Call user's success handler
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}
```

#### Key Implementation Details

##### 1. Query Cancellation
```typescript
// ALWAYS cancel outgoing queries to prevent race conditions
await queryClient.cancelQueries({
  predicate: (query) => {
    const keyStr = JSON.stringify(query.queryKey);
    return keyStr.includes('targetQuery') && keyStr.includes(identifier);
  },
});
```

##### 2. Cache Key Discovery
```typescript
// The tRPC query keys can be complex, so we search for them dynamically
const cache = queryClient.getQueryCache();
const allQueries = cache.getAll();

for (const query of allQueries) {
  const keyStr = JSON.stringify(query.queryKey);
  if (keyStr.includes('queryName') && keyStr.includes(identifier)) {
    actualKey = query.queryKey;
    previousData = query.state.data;
    break;
  }
}
```

##### 3. Safe Cache Updates
```typescript
// ALWAYS check data exists and has expected shape before updating
queryClient.setQueryData(actualKey, (old: any) => {
  if (!old) return old; // Guard against undefined
  
  // Transform data based on mutation type
  return transformedData;
});
```

##### 4. Context for Rollback
```typescript
// ALWAYS return context with snapshot for rollback capability
return { 
  previousData,     // Snapshot of data before mutation
  actualKey,        // The exact query key for updates
  ...otherContext   // Any other data needed for rollback
};
```

#### Real-World Examples from Codebase

##### Example 1: Requirement Approval (List Update)
```typescript
// Updates a single item in a list
queryClient.setQueryData(actualKey, (old: any) => {
  if (!old || !Array.isArray(old)) return old;

  return old.map((sub: any) =>
    sub.id === requirementId
      ? {
          ...sub,
          status: 'APPROVED',
          validatedAt: new Date().toISOString(),
          validatedById: 'optimistic',
        }
      : sub
  );
});
```

##### Example 2: Provider Status Update (Object Update)
```typescript
// Updates a single object
queryClient.setQueryData(actualKey, (old: any) => {
  if (!old) return old;

  return {
    ...old,
    status: 'REJECTED',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
    approvedAt: null,
    approvedById: null,
  };
});
```

#### Best Practices

1. **Always Cancel Queries**: Prevent race conditions by canceling outgoing refetches
2. **Snapshot Everything**: Store enough context to fully restore previous state
3. **Guard Updates**: Check data existence and shape before transforming
4. **Use Predicates**: Use flexible predicate functions for query matching
5. **Invalidate Broadly**: Invalidate all related queries in onSuccess
6. **Log Everything**: Add console logs for debugging optimistic updates
7. **Handle Edge Cases**: Account for missing data or unexpected shapes

#### When to Use This Pattern

✅ **Use for:**
- Admin approval/rejection workflows
- Status updates that need immediate feedback
- Toggle operations (active/inactive, enabled/disabled)
- Any mutation where the user expects instant feedback

❌ **Don't use for:**
- Create operations (no existing data to update)
- Delete operations (consider hiding item instead)
- Complex multi-step workflows
- Operations where the result is unpredictable

#### Common Pitfalls

1. **Not Canceling Queries**: Leads to race conditions where old data overwrites optimistic updates
2. **Wrong Query Keys**: tRPC query keys are complex; always search dynamically
3. **Mutating State**: Always return new objects/arrays, never mutate
4. **Missing Guards**: Always check data exists before updating
5. **Incomplete Rollback**: Ensure all updated fields are restored on error

#### Testing Optimistic Updates

```typescript
// Simulate slow network to see optimistic updates
const SIMULATE_DELAY = true;

if (SIMULATE_DELAY) {
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// Simulate random failures to test rollback
const SIMULATE_FAILURE = Math.random() > 0.5;

if (SIMULATE_FAILURE) {
  throw new Error('Simulated network failure');
}
```

#### Migration Checklist

When migrating an existing mutation to use optimistic updates:

- [ ] Identify all queries that display the mutated data
- [ ] Determine the exact shape of cached data
- [ ] Implement query cancellation in onMutate
- [ ] Add cache discovery logic
- [ ] Implement optimistic cache update
- [ ] Return proper context for rollback
- [ ] Implement rollback in onError
- [ ] Add query invalidation in onSuccess
- [ ] Test with slow network simulation
- [ ] Test error scenarios and rollback

### Database & Schema Management

- **Schema Changes**: Database schema changes require Prisma migrations
- **Type Safety**: Use Prisma for type-safe database queries
- **Optimistic Locking**: Bookings/slots use version control for calendar sync
- **Polymorphic Relations**: Subscriptions can belong to Provider, Organization, or Location
- **Audit Trails**: Organization membership changes are fully tracked

### Code Quality Standards

- **95% Confidence Rule**: Only implement when 95% confident of approach and alignment with user needs. Ask clarifying questions until reaching 95% confidence before any implementation.
- **Clarifying Questions**: Ask questions if below 95% confidence threshold
- **Error Handling**: Consistent error handling with proper HTTP status codes
- **Debugging**: Use comprehensive console logging for troubleshooting
- **Linting**: Always run `npm run lint` after code changes
- **Auto-Linting on Save**: The project has linting that runs automatically on file save. When encountering linting errors, prompt the user to save the file to see if auto-linting resolves the issues before running manual lint commands
- **File Naming**: All files and folders use kebab-case naming convention
- **Code Style**: Follow ESLint rules - single quotes, semicolons, arrow functions, template literals

#### Post-Development Workflow

When development is complete request user to run `npm run fix` from their IDE terminal to resolve linting issues

#### Alternative Workflows

- **Auto-Linting on Save**: When working in your code editor, linting runs automatically on file save
- **Pre-commit**: Consider setting up pre-commit hooks to automatically format/lint

### File & Code Conventions

#### Import & Export Patterns

- **Explicit Imports**: Prefer direct imports from source files
- **Index Files**: Avoid index files that simply re-export components
- **Direct Paths**: Use explicit file paths rather than barrel exports
- **Example**: `import { Button } from './components/button'` not `import { Button } from './components'`

#### File Naming

- **All TypeScript files**: Use kebab-case (e.g., `user-profile.tsx`, `service-provider-type.ts`)
- **Folders**: Use kebab-case (e.g., `service-provider/`, `organization-management/`)
- **Ignores**: Middle extensions are ignored (e.g., `user.types.ts` is valid)

#### Code Style

- **Quotes**: Single quotes for strings (`'hello'` not `"hello"`)
- **Semicolons**: Required at end of statements
- **Functions**: Prefer arrow functions (`const fn = () => {}`)
- **Templates**: Use template literals over concatenation (`` `Hello ${name}` ``)
- **Imports**: Named exports preferred over default exports
- **JSX**: React import not required (Next.js auto-imports)
- **Props Spreading**: JSX prop spreading is allowed
- **Images**: Regular `<img>` elements allowed (Next.js Image not enforced)
- **TypeScript**: Use proper type definitions, avoid `any` types
- **Explicit Imports**: Prefer explicit imports over index file re-exports

#### Formatting Standards

- **Line Width**: Maximum 100 characters per line
- **Indentation**: 2 spaces (no tabs)
- **Line Endings**: Unix-style (LF)
- **Trailing Commas**: ES5 style (objects, arrays, but not function parameters)

#### Import Organization

Imports are automatically sorted in this order:

1. **React/Next.js imports**: `react`, `next/*` modules first
2. **Third-party modules**: External npm packages
3. **Internal modules**: `@/` aliased imports (absolute paths)
4. **Relative imports**: `./` and `../` imports last

**Import Features**:

- Automatic separation between import groups (blank lines)
- Alphabetical sorting within each group
- Specifier sorting within import statements

#### Tailwind CSS

- **Class Sorting**: Tailwind classes are automatically sorted
- **Consistent Ordering**: Ensures consistent class order across components

#### Prettier Integration

- **Auto-formatting**: Prettier runs automatically on save
- **ESLint Integration**: ESLint enforces Prettier formatting rules
- **Error Resolution**: When encountering linting errors, save the file first to trigger auto-formatting
- **Plugin-Enhanced**: Import sorting and Tailwind class sorting happen automatically

### Key Implementation Notes

- **Slot-Based Billing**: All pricing is based on availability slots, not bookings
- **Soft Dependencies**: Many relationships are optional to support various business models
- **Version Control**: Use optimistic locking for entities synced with external calendars
- **Role-Based Access**: Implement proper role checking for all protected operations
- **Client/Server Separation**: Client hooks must never import Prisma - always use API routes or server actions

## CRITICAL: NO MOCK DATA POLICY

- **NEVER create, return, or use mock data anywhere in the application**
- **ALWAYS use real data from APIs, database, or user input**
- **If data is not available, show appropriate loading states or empty states**
- **If APIs fail, show proper error messages with retry options**
- **Use loading skeletons, spinners, or "No data available" messages instead of fake data**
- **This applies to all components, hooks, services, and any part of the application**
- **Mock data creates false user experiences and hides real issues**

### Instead of Mock Data

- ✅ Show loading states while fetching real data
- ✅ Display "No data available" when real data is empty
- ✅ Show error states when data fetching fails
- ✅ Use skeleton loaders during loading
- ✅ Implement proper error boundaries and retry mechanisms

### Examples of What NOT to Do

- ❌ `return { id: 'mock-1', name: 'Mock Provider' }`
- ❌ `const mockData = [{ ... }]`
- ❌ Hardcoded sample data for testing UI
- ❌ Placeholder data that looks real but isn't from the database

### Examples of What TO Do

- ✅ `if (isLoading) return <LoadingSpinner />`
- ✅ `if (error) return <ErrorMessage error={error} />`
- ✅ `if (!data?.length) return <EmptyState message="No providers found" />`
- ✅ Real API calls with proper error handling

## CRITICAL: CLIENT/SERVER SEPARATION

### NEVER Import Prisma in Client Code

- **Client hooks MUST NOT import Prisma directly**
- **React components MUST NOT import Prisma**
- **Any code that runs in the browser MUST NOT access the database directly**
- **Database queries ONLY in tRPC procedures (`/server/api/routers/`) for automatic type inference**
- **Server actions ONLY for business logic, validation, and notifications**

### Correct Data Flow

1. **Client Hook** → calls tRPC procedure
2. **tRPC Procedure** → queries Prisma database directly (single query)
3. **For Business Logic**: tRPC Procedure → calls server action → returns metadata → tRPC queries database
4. **Never use server actions for database queries** - only for business logic

### Build Errors Indicate Wrong Pattern

- **If you get Prisma build errors in client code, you're doing it wrong**
- **Prisma should only be imported in server-side code**
- **Client code should use fetch() or server actions, never Prisma directly**
