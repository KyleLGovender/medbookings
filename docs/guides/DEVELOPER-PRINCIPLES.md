# MedBookings Developer Principles & Standards

**Purpose**: Comprehensive reference guide for developers working on the MedBookings project
**Audience**: New and existing developers, code reviewers
**Last Updated**: 2025-10-09

---

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Critical Principles](#critical-principles)
3. [Timezone Handling](#timezone-handling)
4. [Type Safety & Organization](#type-safety--organization)
5. [Logging & PHI Protection](#logging--phi-protection)
6. [Database Operations](#database-operations)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Development (tRPC)](#api-development-trpc)
9. [Component Development](#component-development)
10. [State Management](#state-management)
11. [Form Handling](#form-handling)
12. [Validation](#validation)
13. [Performance Standards](#performance-standards)
14. [Security Standards](#security-standards)
15. [File Naming & Organization](#file-naming--organization)
16. [Code Style & Formatting](#code-style--formatting)
17. [Git Workflow](#git-workflow)
18. [Testing Standards](#testing-standards)
19. [Build & Verification](#build--verification)
20. [Quick Reference](#quick-reference-forbidden-vs-required)

---

## Introduction

MedBookings is a POPIA-compliant healthcare booking platform built with Next.js 14, tRPC, and Prisma. This document outlines all enforced coding principles, patterns, and standards that developers must follow.

### Why These Principles?

1. **POPIA Compliance**: South African healthcare data protection law requires strict PHI protection
2. **Type Safety**: Prevent runtime errors through comprehensive type checking
3. **Performance**: Ensure fast, scalable application with proper data fetching patterns
4. **Security**: Protect sensitive healthcare information and prevent vulnerabilities
5. **Maintainability**: Consistent patterns make the codebase easier to understand and modify

### How to Use This Guide

- **Starting a new feature?** Read the relevant sections for your work
- **Code review?** Use this as a checklist
- **Got a lint error?** Find the principle here and see the correct pattern
- **Quick lookup?** Jump to [Quick Reference](#quick-reference-forbidden-vs-required)

---

## Critical Principles

### ALWAYS ✅

1. **95% Confidence Rule**: Ask questions when confidence < 95% - never guess
2. **Verify Everything**: Never skip verification because it "looks fine"
3. **Prefer Editing**: Always edit existing code over creating new files
4. **Follow Next.js 14 App Router**: Use Server Components by default
5. **Run Build Gates**: Execute `tsc --noEmit && npm run build && npm run lint` after changes
6. **Explicit Approval**: Get user confirmation before marking tasks complete

### NEVER ❌

1. **Never** implement when uncertain - clarify first
2. **Never** create new code when existing code can be modified
3. **Never** skip security for speed
4. **Never** use dummy/placeholder implementations
5. **Never** commit changes without explicit user request
6. **Never** bypass pre-commit hooks without approval
7. **Never** give up on tasks - identify root causes instead

---

## Timezone Handling

### 🔴 CRITICAL: POPIA Compliance Requirement

All dates/times must use UTC in the database to comply with POPIA healthcare regulations. South Africa timezone is UTC+2 (no DST).

### ❌ FORBIDDEN - These Are BLOCKED by ESLint

```typescript
// ❌ Direct Date usage (BLOCKED)
const now = new Date();
const timestamp = Date.now();

// ❌ Will fail ESLint with: "Use nowUTC() instead of new Date()"
```

### ✅ REQUIRED - Use Timezone Utilities

**Import from** `/src/lib/timezone.ts`

```typescript
import {
  endOfDaySAST,
  formatSAST,
  fromUTC,
  nowSAST,
  nowUTC,
  startOfDaySAST,
  toUTC,
} from '@/lib/timezone';

// ✅ Current time in UTC
const now = nowUTC();

// ✅ Current time in SAST (for display)
const localTime = nowSAST();

// ✅ Convert client date to UTC for storage
const utcDate = toUTC(clientDate);

// ✅ Convert UTC date for display
const displayDate = fromUTC(dbDate);

// ✅ Format for South African users
const formatted = formatSAST(date, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// ✅ Date range queries (CRITICAL for bookings)
const start = startOfDaySAST(selectedDate); // Returns UTC
const end = endOfDaySAST(selectedDate); // Returns UTC

const bookings = await prisma.booking.findMany({
  where: {
    startTime: { gte: start, lte: end },
  },
});
```

### Common Patterns

#### Token Expiry

```typescript
// ❌ WRONG
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

// ✅ CORRECT
import { nowUTC, addMilliseconds } from '@/lib/timezone';
const expires = addMilliseconds(nowUTC(), 24 * 60 * 60 * 1000);
```

#### Booking Creation

```typescript
// ❌ WRONG
const booking = await prisma.booking.create({
  data: {
    startTime: new Date(userInput.startTime),  // Dangerous!
    endTime: new Date(userInput.endTime)
  }
});

// ✅ CORRECT
import { toUTC } from '@/lib/timezone';
const booking = await prisma.booking.create({
  data: {
    startTime: toUTC(new Date(userInput.startTime)),
    endTime: toUTC(new Date(userInput.endTime))
  }
});
```

---

## Type Safety & Organization

### Avoid `any` Types

**ESLint Rule**: `@typescript-eslint/no-explicit-any` (warn → migrating to error)

```typescript
// ❌ FORBIDDEN
const handleData = (data: any) => {
  return data.someProperty;
};

// ✅ CORRECT - Extract proper types
import { type RouterOutputs } from '@/utils/api';
type Provider = RouterOutputs['providers']['getAll'][number];

const handleData = (data: Provider) => {
  return data.name;  // Type-safe!
};
```

### tRPC Type Extraction

**NEVER export types from hooks. ALWAYS extract from RouterOutputs.**

```typescript
// ❌ FORBIDDEN - Type export from hook
// File: features/admin/hooks/use-admin-providers.ts
export type AdminProvider = RouterOutputs['admin']['getProviders'][number];
export function useAdminProviders() {
  return api.admin.getProviders.useQuery();
}

// ✅ CORRECT - No type exports, extract in component
// File: features/admin/hooks/use-admin-providers.ts
export function useAdminProviders() {
  return api.admin.getProviders.useQuery();
}

// File: features/admin/components/provider-list.tsx
import { type RouterOutputs } from '@/utils/api';
type AdminProvider = RouterOutputs['admin']['getProviders'][number];

function ProviderList() {
  const { data: providers } = useAdminProviders();
  // providers is type-safe!
}
```

### Prisma Enums

**ALWAYS use generated Prisma enums, NEVER create manual enums.**

```typescript
// ✅ CORRECT - Use Prisma enum
import { BookingStatus } from '@prisma/client';
// ✅ With Zod validation
import { z } from 'zod';

// ❌ FORBIDDEN - Manual enum
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

const bookingSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});
```

### Type File Organization

**Enforced by custom ESLint rules**

```
feature/
└── types/
    ├── types.ts      # Domain types (interfaces, type aliases)
    ├── schemas.ts    # Zod schemas
    ├── guards.ts     # Type guards (acceptable `as any` use)
    └── enums.ts      # Manual enums (rare, prefer Prisma)
```

**Rules:**

- ❌ NO `index.ts` files in type directories (barrel exports forbidden)
- ✅ Direct imports only: `import { User } from '@/features/auth/types/types'`
- ✅ File headers with JSDoc comments (enforced, warnings for now)

---

## Logging & PHI Protection

### 🔴 CRITICAL: POPIA Compliance Requirement

Protected Health Information (PHI) must NEVER appear in raw logs. All PHI must be sanitized.

### ❌ FORBIDDEN - These Are BLOCKED by ESLint

```typescript
// ❌ console.log (BLOCKED by ESLint)
console.log('User email:', user.email);
console.error('Error for user:', user.name);

// ❌ PHI in logs
logger.info('User logged in', { email: user.email }); // RAW EMAIL!
```

### ✅ REQUIRED - Use Logger with PHI Sanitization

**Import from** `/src/lib/logger.ts`

```typescript
import { logger, sanitizeEmail, sanitizeName, sanitizePhone } from '@/lib/logger';

// ✅ Debug logs (feature-flagged)
logger.debug('forms', 'Form validation started', { formName: 'registration' });

// ✅ Info logs (development only)
logger.info('User logged in', {
  email: sanitizeEmail(user.email), // "jo***@example.com"
  name: sanitizeName(user.name), // "Jo** Do*"
});

// ✅ Warnings
logger.warn('Rate limit approaching', {
  userId: sanitizeUserId(user.id),
  requestCount: 95,
});

// ✅ Errors
logger.error('Database query failed', error, {
  operation: 'findProvider',
  providerId: sanitizeProviderId(id),
});

// ✅ Audit logs (ALWAYS logged for compliance)
logger.audit('Provider approved', {
  adminId: sanitizeUserId(ctx.session.user.id),
  providerId: sanitizeProviderId(provider.id),
  action: 'APPROVE_PROVIDER',
});
```

### PHI Sanitization Functions

```typescript
sanitizeEmail(email); // "john@example.com" → "jo***@example.com"
sanitizePhone(phone); // "+27821234567" → "+2782***4567"
sanitizeName(name); // "John Doe" → "Jo** Do*"
sanitizeToken(token); // "abc123...xyz789" → "abc123def4..."
sanitizeUserId(id); // "cuid123" → "[USER:cuid123]"
sanitizeContext(obj); // Auto-sanitizes all PHI fields in object
```

### Feature Debug Flags

**Enable selective debug logging** via environment variables:

```env
DEBUG_ALL=true              # Enable all debug logs
DEBUG_FORMS=true            # Form validation
DEBUG_MAPS=true             # Google Maps
DEBUG_ADMIN=true            # Admin operations
DEBUG_CALENDAR=true         # Calendar operations
DEBUG_BOOKINGS=true         # Booking operations
```

Usage:

```typescript
logger.debug('forms', 'Form submitted', { values: sanitizedData });
// Only logs if DEBUG_FORMS=true or DEBUG_ALL=true
```

### Audit Logging for Compliance

**REQUIRED for sensitive operations:**

```typescript
import { createAuditLog } from '@/lib/audit';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/audit';

await createAuditLog({
  action: 'Provider approved',
  category: 'ADMIN_ACTION',
  userId: ctx.session.user.id,
  userEmail: sanitizeEmail(ctx.session.user.email),
  resource: 'Provider',
  resourceId: sanitizeProviderId(provider.id),
  ipAddress: getIpFromRequest(req),
  userAgent: getUserAgentFromRequest(req),
  metadata: {
    previousStatus: provider.status,
    newStatus: 'APPROVED',
  },
});
```

**Audit Categories:**

- `AUTHENTICATION` - Login attempts, sessions
- `AUTHORIZATION` - Access control decisions
- `PHI_ACCESS` - Viewing/accessing PHI data
- `ADMIN_ACTION` - Admin operations
- `DATA_MODIFICATION` - Create/update/delete
- `SECURITY` - Security events
- `GENERAL` - Other audit-worthy events

---

## Database Operations

### Transactions for Multi-Table Operations

**REQUIRED for data integrity and preventing race conditions.**

```typescript
// ❌ FORBIDDEN - No transaction (race condition!)
const slot = await prisma.calculatedAvailabilitySlot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') throw new Error('Slot unavailable');

await prisma.booking.create({ data: { slotId: id, ...bookingData } });
await prisma.calculatedAvailabilitySlot.update({
  where: { id },
  data: { status: 'BOOKED' },
});

// ✅ CORRECT - Use transaction with timeouts
await prisma.$transaction(
  async (tx) => {
    // 1. Lock the slot
    const slot = await tx.calculatedAvailabilitySlot.findUnique({
      where: { id: slotId },
    });

    // 2. Verify availability
    if (!slot || slot.status !== 'AVAILABLE') {
      throw new Error('Slot unavailable');
    }

    // 3. Create booking
    const booking = await tx.booking.create({
      data: { slotId: id, ...bookingData },
    });

    // 4. Update slot
    await tx.calculatedAvailabilitySlot.update({
      where: { id },
      data: { status: 'BOOKED' },
    });

    return booking;
  },
  {
    maxWait: 10000, // Max time to wait for transaction to start
    timeout: 20000, // Max time for transaction to complete
  }
);
```

### Pagination - REQUIRED for All Queries

**ESLint Warning**: Pre-commit hook validates pagination

```typescript
// ❌ FORBIDDEN - Unbounded query
const providers = await prisma.provider.findMany({
  where: { status: 'APPROVED' }
});

// ✅ CORRECT - Always use take: and skip:
const providers = await prisma.provider.findMany({
  where: { status: 'APPROVED' },
  take: 50,                    // REQUIRED
  skip: offset,
  orderBy: { createdAt: 'desc' }
});

// ✅ Better - Use pagination helper
import { createPagination } from '@/lib/pagination';

const { take, skip } = createPagination({ page: 1, pageSize: 50 });
const providers = await prisma.provider.findMany({
  where: { status: 'APPROVED' },
  take,
  skip,
  orderBy: { createdAt: 'desc' }
});
```

### Prevent N+1 Queries

```typescript
// ❌ FORBIDDEN - N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const bookings = await prisma.booking.findMany({
    where: { clientId: user.id }
  });
  // Process bookings...
}

// ✅ CORRECT - Use eager loading with include
const users = await prisma.user.findMany({
  include: {
    bookingsAsClient: {
      where: { status: 'CONFIRMED' },
      take: 10
    }
  },
  take: 50
});

// ✅ Alternative - Single query with join
const bookings = await prisma.booking.findMany({
  where: { clientId: { in: userIds } },
  include: { client: true },
  take: 500
});
```

### Database Access Rules

**CRITICAL architectural boundary:**

```typescript
// ❌ FORBIDDEN - Prisma in client components
'use client';
import { prisma } from '@/lib/prisma';  // ERROR!

// ❌ FORBIDDEN - Prisma in custom hooks
export function useProviders() {
  return useQuery(() => prisma.provider.findMany());  // ERROR!
}

// ❌ FORBIDDEN - Returning DB results from server actions
export async function createProvider(data) {
  return await prisma.provider.create({ data });  // ERROR!
}

// ✅ CORRECT - Prisma ONLY in tRPC procedures
export const providersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({  // ✅ ONLY place!
      take: 50
    });
  })
});

// ✅ CORRECT - Client uses tRPC hook
export function useProviders() {
  return api.providers.getAll.useQuery();
}

// ✅ CORRECT - Server action returns metadata only
export async function createProvider(data) {
  await sendEmail(data.email);
  return { success: true, providerId: data.id };
}
```

---

## Authentication & Authorization

### tRPC Procedures

**Use the correct procedure based on authorization requirements:**

```typescript
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
} from '@/server/trpc';

export const exampleRouter = createTRPCRouter({
  // ✅ Public - No auth required
  getProviders: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({ take: 50 });
  }),

  // ✅ Protected - Requires authentication
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.booking.findMany({
      where: { clientId: ctx.session.user.id },
      take: 50,
    });
  }),

  // ✅ Admin - Requires ADMIN or SUPER_ADMIN role
  approveProvider: adminProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.provider.update({
        where: { id: input.providerId },
        data: { status: 'APPROVED' },
      });
    }),

  // ✅ Super Admin - Requires SUPER_ADMIN only
  deleteUser: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.delete({
        where: { id: input.userId },
      });
    }),
});
```

### Middleware Route Protection

Routes are automatically protected by `/src/middleware.ts`. Understanding the rules:

**Role Hierarchy:**

- `USER` - Basic authenticated user (profile, settings, dashboard)
- `VERIFIED_USER` - Email verified (calendar, bookings, providers)
- `ADMIN` - Admin user (organizations, admin dashboard)
- `SUPER_ADMIN` - Super admin (all permissions)

**Protected Route Examples:**

- `/calendar/*` → Requires VERIFIED_USER
- `/bookings/*` → Requires VERIFIED_USER
- `/organizations/*` → Requires ADMIN
- `/admin/*` → Requires ADMIN or SUPER_ADMIN

---

## API Development (tRPC)

### Required tRPC Pattern

**NEVER deviate from this structure:**

```typescript
export const featureRouter = createTRPCRouter({
  procedureName: protectedProcedure
    .input(
      z.object({
        // 1. Zod validation REQUIRED
        id: z.string(),
        name: z.string().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      // 2. Authorization check FIRST
      if (input.id !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // 3. Single database query
      const result = await ctx.prisma.model.findUnique({
        where: { id: input.id },
        include: { relations: true },
        take: 50, // Pagination if returning list
      });

      // 4. Error handling
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // 5. Return data
      return result;
    }),
});
```

### Single Query Rule

**FORBIDDEN: Multiple queries per endpoint**

```typescript
// ❌ FORBIDDEN - Multiple queries (waterfall)
const provider = await ctx.prisma.provider.create({ data: input });
const services = await ctx.prisma.service.findMany({
  where: { providerId: provider.id }
});
return { provider, services };

// ✅ CORRECT - Single query with include
const provider = await ctx.prisma.provider.create({
  data: input,
  include: { services: true }
});
return provider;
```

### Error Handling

```typescript
import { TRPCError } from '@trpc/server';

// ✅ Use tRPC error codes
throw new TRPCError({
  code: 'BAD_REQUEST', // Or: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, etc.
  message: 'Invalid provider ID',
});

// ✅ With cause for logging
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Failed to create booking',
  cause: originalError,
});
```

---

## Component Development

### Server Components by Default

```typescript
// ✅ Server Component (default)
export default async function ProvidersPage() {
  // Can do async operations, access database via tRPC
  return <div>...</div>;
}

// ✅ Client Component (only when needed)
'use client';
export function InteractiveForm() {
  const [state, setState] = useState();
  // Has interactivity, hooks
  return <form>...</form>;
}
```

**Use Client Components when:**

- Using React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- tRPC hooks (useQuery, useMutation)

### Data Fetching

```typescript
// ✅ Server Component - Direct tRPC call
import { api } from '@/trpc/server';

export default async function Page() {
  const providers = await api.providers.getAll.query();
  return <List data={providers} />;
}

// ✅ Client Component - tRPC hook
'use client';
import { api } from '@/utils/api';

export function ProviderList() {
  const { data, isLoading } = api.providers.getAll.useQuery();

  if (isLoading) return <Spinner />;
  return <List data={data} />;
}
```

### Images

**ALWAYS use Next.js Image component:**

```typescript
// ❌ FORBIDDEN
<img src="/avatar.png" alt="Avatar" />

// ✅ CORRECT
import Image from 'next/image';
<Image src="/avatar.png" alt="Avatar" width={48} height={48} />
```

---

## State Management

### TanStack Query via tRPC Only

```typescript
// ❌ FORBIDDEN - Redux, Zustand, Context in features
import { create } from 'zustand';
export const useStore = create((set) => ({ ... }));

// ❌ FORBIDDEN - React Context for features
export const FeatureContext = createContext();

// ✅ CORRECT - tRPC + TanStack Query
export function useProviders() {
  return api.providers.getAll.useQuery();
}

// ✅ State lives in TanStack Query cache
const { data, isLoading, error, refetch } = useProviders();
```

### Optimistic Updates

```typescript
const utils = api.useContext();

const { mutate } = api.providers.update.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing fetches
    await utils.providers.getAll.cancel();

    // Snapshot previous value
    const previous = utils.providers.getAll.getData();

    // Optimistically update
    utils.providers.getAll.setData(undefined, (old) =>
      old?.map((p) => (p.id === variables.id ? { ...p, ...variables } : p))
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.providers.getAll.setData(undefined, context?.previous);
  },
  onSettled: () => {
    // Refetch to ensure sync
    utils.providers.getAll.invalidate();
  },
});
```

---

## Form Handling

### React Hook Form + Zod

**REQUIRED pattern for all forms:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProviderStatus } from '@prisma/client';

// 1. Define Zod schema
const providerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  status: z.nativeEnum(ProviderStatus),  // Prisma enum
  metadata: z.record(z.string())         // Nested data
});

type ProviderFormData = z.infer<typeof providerSchema>;

// 2. Use in component
export function ProviderForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema)
  });

  const { mutate } = api.providers.create.useMutation();

  const onSubmit = (data: ProviderFormData) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
      {/* ... */}
    </form>
  );
}
```

---

## Validation

### Zod Everywhere

**REQUIRED:**

- All tRPC inputs
- All forms
- All API endpoints
- All environment variables

```typescript
// ✅ tRPC input validation
createProvider: protectedProcedure
  .input(z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    services: z.array(z.string()).min(1)
  }))
  .mutation(async ({ ctx, input }) => { ... })

// ✅ Form validation
const formSchema = z.object({ ... });

// ✅ Environment variable validation
// File: src/config/env/server.ts
import { z } from 'zod';
export const serverEnv = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32)
}).parse(process.env);
```

---

## Performance Standards

### Database Performance

```typescript
// ✅ Pagination for lists > 20 items
const providers = await prisma.provider.findMany({ take: 50 });

// ✅ No N+1 queries - use eager loading
const bookings = await prisma.booking.findMany({
  include: { client: true, slot: true },
  take: 100
});

// ✅ Indexes on queried columns (in schema.prisma)
model Provider {
  email String @unique
  status ProviderStatus

  @@index([status])
  @@index([email])
}
```

### Frontend Performance

```typescript
// ✅ Memoization for expensive computations
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// ✅ Callback memoization
const handleClick = useCallback(() => { ... }, [deps]);

// ✅ Component memoization
export const ExpensiveComponent = memo(({ data }) => { ... });

// ✅ Debounce user input
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

### API Performance

```typescript
// ✅ Cache GET requests (minimum 5 seconds)
export function useProviders() {
  return api.providers.getAll.useQuery(undefined, {
    staleTime: 5000, // Consider data fresh for 5 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
}

// ❌ No API calls in loops
for (const id of ids) {
  const provider = await api.providers.getById.query({ id }); // BAD
}

// ✅ Batch fetch instead
const providers = await api.providers.getByIds.query({ ids });
```

---

## Security Standards

### Input Sanitization

```typescript
// ✅ All user inputs validated with Zod
const input = z
  .object({
    name: z.string().trim().max(100),
    email: z.string().email(),
  })
  .parse(userInput);

// ✅ No raw SQL
const providers = await prisma.provider.findMany({
  where: { name: { contains: sanitizedSearch } },
});
```

### Authentication Checks

```typescript
// ✅ ALL routes protected by middleware
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};

// ✅ ALL API endpoints have authorization
approveProvider: adminProcedure  // Checks role automatically
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => { ... })
```

### Rate Limiting

**REQUIRED in production (Upstash Redis):**

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // Check rate limit
  const { success } = await rateLimit.limit(req.headers.get('x-forwarded-for') ?? 'anonymous');

  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Process request...
}
```

---

## File Naming & Organization

### Naming Conventions

**Enforced by ESLint:**

```
✅ kebab-case for files:
- provider-list.tsx
- use-admin-providers.ts
- create-booking-schema.ts

✅ kebab-case for folders:
- feature-modules/
- admin-dashboard/
- booking-management/

❌ NOT allowed:
- ProviderList.tsx (PascalCase)
- useAdminProviders.ts (camelCase)
- admin_dashboard/ (snake_case)
```

### Feature Module Structure

**REQUIRED structure:**

```
features/
└── feature-name/
    ├── components/     # UI components
    ├── hooks/          # tRPC hooks (no types exported!)
    ├── lib/            # Server actions, utilities
    └── types/
        ├── types.ts    # Domain types
        ├── schemas.ts  # Zod schemas
        └── guards.ts   # Type guards
```

### Architecture Boundaries

```typescript
// ❌ FORBIDDEN - Cross-feature imports
import { ProviderCard } from '@/features/providers/components/provider-card';
// Used in: features/organizations/...

// ✅ CORRECT - Shared components go in /src/components
// Move to: /src/components/provider-card.tsx
import { ProviderCard } from '@/components/provider-card';

// ❌ FORBIDDEN - Business logic in /src/lib/*
// File: src/lib/booking-logic.ts
export function validateBooking() { ... }

// ✅ CORRECT - Business logic stays in features
// File: features/bookings/lib/validate-booking.ts
export function validateBooking() { ... }
```

---

## Code Style & Formatting

### Enforced by ESLint & Prettier

```typescript
// ✅ Direct imports (no barrel exports)
import { Provider } from '@/features/providers/types/types';

// ✅ Single quotes
const message = 'Hello';

// ✅ Semicolons
const value = 42;

// ✅ Arrow functions
const add = (a: number, b: number) => a + b;

// ✅ Template literals for concatenation
const greeting = `Hello, ${name}`;

// ✅ 2-space indentation
function example() {
  if (condition) {
    doSomething();
  }
}

// ✅ 100 character line limit
const longLine = 'This is a very long line that exceeds 100 characters so we break it';

// NOT: import { Provider } from '@/features/providers/types';
```

---

## Git Workflow

### Commit Rules

```bash
# ❌ NEVER commit without user request
git add . && git commit -m "..." # FORBIDDEN without approval

# ❌ NEVER push without user confirmation
git push  # FORBIDDEN without approval

# ❌ NEVER bypass hooks
git commit --no-verify  # FORBIDDEN without explicit approval

# ❌ NEVER force push to main/master
git push --force origin main  # FORBIDDEN
```

### Pre-commit Hooks

**Automatically run via Husky:**

```bash
# Validates:
- ✅ Timezone compliance (no new Date())
- ✅ Type safety (limited any usage)
- ✅ PHI sanitization in logging
- ✅ Cross-feature imports
- ✅ Type exports from hooks
- ✅ Zod validation in tRPC
- ✅ Transactions for bookings
- ✅ Pagination in queries
```

If hooks fail:

1. Read the error message
2. Fix the violation (see relevant section in this doc)
3. Try committing again

---

## Testing Standards

### Playwright E2E Testing

**Only E2E tests currently (no unit tests).**

```typescript
// File: e2e/tests/booking/create-booking.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Booking Creation', () => {
  test('should create a booking successfully', async ({ page }) => {
    // 1. Setup
    await page.goto('/calendar');
    await page.click('[data-testid="available-slot"]');

    // 2. Action
    await page.fill('[name="notes"]', 'Test booking');
    await page.click('[type="submit"]');

    // 3. Assert
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

**Test Categories:**

- `e2e/tests/auth/` - Authentication flows
- `e2e/tests/booking/` - Booking operations
- `e2e/tests/provider/` - Provider management
- `e2e/tests/calendar/` - Calendar functionality

**Commands:**

```bash
npm run test              # Run all tests
npm run test:headed       # Visual mode
npm run test:debug        # Debug mode
npm run test:auth         # Auth tests only
```

---

## Build & Verification

### MANDATORY Before Task Completion

**Run these commands after EVERY file modification:**

```bash
# TypeScript type checking
npx tsc --noEmit

# Build verification
npm run build

# Linting
npm run lint
```

**ALL must pass before:**

- Marking tasks complete
- Creating pull requests
- Moving to next implementation phase

### Build Error Resolution

1. Run `npm run build` to see full error output
2. Provide detailed analysis of error
3. Fix errors systematically (not trial-and-error)
4. Re-run build after each fix
5. Continue until build passes completely
6. **NEVER proceed with failing build**

---

## Quick Reference: Forbidden vs Required

### Timezone ⏰

| ❌ FORBIDDEN          | ✅ REQUIRED                |
| --------------------- | -------------------------- |
| `new Date()`          | `nowUTC()`                 |
| `Date.now()`          | `nowUTC()`                 |
| `new Date(timestamp)` | `fromTimestamp(timestamp)` |

### Logging 📝

| ❌ FORBIDDEN      | ✅ REQUIRED                               |
| ----------------- | ----------------------------------------- |
| `console.log()`   | `logger.info()`                           |
| `console.error()` | `logger.error()`                          |
| Raw PHI in logs   | `sanitizeEmail()`, `sanitizeName()`, etc. |

### Type Safety 🔐

| ❌ FORBIDDEN            | ✅ REQUIRED                                  |
| ----------------------- | -------------------------------------------- |
| `any` types             | Proper type extraction                       |
| Type exports from hooks | Extract in component: `RouterOutputs['...']` |
| Manual enums            | `import { Enum } from '@prisma/client'`      |
| Barrel exports in types | Direct imports                               |

### Database 🗄️

| ❌ FORBIDDEN          | ✅ REQUIRED                             |
| --------------------- | --------------------------------------- |
| Unbounded queries     | `take: 50` (pagination)                 |
| N+1 queries           | Eager loading with `include`            |
| No transactions       | `prisma.$transaction()` for multi-table |
| Prisma in client code | Prisma ONLY in tRPC procedures          |

### Architecture 🏗️

| ❌ FORBIDDEN                     | ✅ REQUIRED                           |
| -------------------------------- | ------------------------------------- |
| Cross-feature imports            | Feature isolation                     |
| `fetch('/api/...')`              | tRPC hooks                            |
| Multiple DB queries per endpoint | Single query with `include`           |
| Redux/Zustand in features        | TanStack Query via tRPC               |
| Business logic in `/src/lib`     | Business logic in `/features/.../lib` |

### Code Style 🎨

| ❌ FORBIDDEN            | ✅ REQUIRED        |
| ----------------------- | ------------------ |
| Double quotes           | Single quotes      |
| No semicolons           | Semicolons         |
| `function` declarations | Arrow functions    |
| PascalCase files        | kebab-case files   |
| snake_case folders      | kebab-case folders |

### Git 🔄

| ❌ FORBIDDEN                 | ✅ REQUIRED           |
| ---------------------------- | --------------------- |
| Commit without approval      | Explicit user request |
| Push without confirmation    | User confirmation     |
| `--no-verify` (bypass hooks) | Hooks must pass       |
| `--force` push to main       | Never force push main |

---

## Summary

These principles ensure:

- ✅ **POPIA compliance** for healthcare data
- ✅ **Type safety** to prevent runtime errors
- ✅ **Performance** through proper patterns
- ✅ **Security** via input validation and authorization
- ✅ **Maintainability** with consistent architecture

### When in Doubt

1. Check this document
2. Look at existing similar code
3. Ask the team
4. Follow the **95% confidence rule** - never guess!

---

## Cross-References

- **Master Rules**: `/CLAUDE.md`
- **Codebase Overview**: `/docs/claude-agent-context/CLAUDE-AGENT-CONTEXT.md`
- **Compliance Guides**: `/docs/compliance/`
- **Context Loading**: `/docs/compliance/CONTEXT-LOADING.md`
- **Type Safety**: `/docs/compliance/TYPE-SAFETY.md`
- **Timezone Guide**: `/docs/compliance/TIMEZONE-GUIDELINES.md`
- **Logging Guide**: `/docs/compliance/LOGGING.md`

---

**Last Updated**: 2025-10-09
**Document Version**: 1.0
**Maintained By**: Development Team
