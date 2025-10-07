# Developer Onboarding Guide - MedBookings

**Welcome Ariel!** This guide will get you up to speed with the MedBookings codebase quickly and efficiently.

---

## 📚 Table of Contents

1. [Quick Start (Day 1)](#quick-start-day-1)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflow](#development-workflow)
4. [Codebase Navigation](#codebase-navigation)
5. [Adding Features](#adding-features)
6. [Type Safety & Patterns](#type-safety--patterns)
7. [Compliance & Quality](#compliance--quality)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start (Day 1)

### Prerequisites Setup

```bash
# 1. Clone and checkout correct branch
git clone <repo-url>
cd medbookings
git checkout master  # After Kyle merges kyle-dev-branch

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials (ask Kyle for dev database URL)

# 4. Setup database
docker compose up -d  # Starts PostgreSQL locally
npx prisma generate   # Generates Prisma client
npx prisma db push    # Syncs schema to database

# 5. Run development server
npm run dev
# Open http://localhost:3000
```

### Essential Reading (30 minutes)

**Read these files in order:**
1. `README.md` - Project overview
2. `CLAUDE.md` - **CRITICAL** - Development rules and patterns
3. `prisma/schema.prisma` - Database structure (source of truth)
4. `docs/compliance/TYPE-SAFETY.md` - Type patterns
5. `docs/compliance/TIMEZONE-GUIDELINES.md` - Timezone handling

### Your First Exploration (1 hour)

```bash
# Explore project structure
tree -L 2 src/

# See all available routes
find src/app -name "page.tsx" | sort

# Understand tRPC API structure
cat src/server/api/root.ts

# See database schema visually
npx prisma studio  # Opens GUI at http://localhost:5555
```

---

## Architecture Overview

### Tech Stack Philosophy

**Single Source of Truth**:
- **Database schema** → Prisma → tRPC → Component types
- NEVER break this chain by defining types manually

**Key Technologies:**
```
┌─────────────────────────────────────────────────┐
│  Next.js 14 App Router (React Server Components) │
├─────────────────────────────────────────────────┤
│  tRPC (Type-safe API) + TanStack Query          │
├─────────────────────────────────────────────────┤
│  Prisma ORM                                      │
├─────────────────────────────────────────────────┤
│  PostgreSQL Database (UTC timestamps)           │
└─────────────────────────────────────────────────┘
```

### Data Flow Pattern (CRITICAL)

**✅ CORRECT Flow:**
```typescript
// 1. Component calls tRPC hook
const { data: providers } = api.providers.getAll.useQuery();

// 2. tRPC procedure queries database
export const providersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({
      include: { services: true }
    });
  }),
});

// 3. Component uses typed data
providers.map((provider) => provider.services) // ✅ Fully typed!
```

**❌ WRONG Patterns:**
```typescript
// ❌ NEVER import Prisma in client components
import { prisma } from '@/lib/prisma'

// ❌ NEVER use fetch() for internal APIs
fetch('/api/providers')

// ❌ NEVER export types from hooks
export type Provider = RouterOutputs['providers']['getAll'];

// ❌ NEVER access database from server actions
export async function myAction() {
  return prisma.provider.findMany() // ❌ Use tRPC!
}
```

### Feature-Based Structure

```
src/features/[feature-name]/
├── components/        # UI components for this feature
├── hooks/            # tRPC query hooks
├── lib/              # Server actions (NOT database access)
└── types/            # ONLY schemas and domain types
    ├── schemas.ts    # Zod validation schemas
    ├── types.ts      # Domain-specific types
    └── guards.ts     # Runtime type guards
```

**Rules:**
- ❌ **NO cross-feature imports** - Features are independent
- ❌ **NO database queries in `/lib`** - Only in tRPC routers
- ✅ **Shared components** go in `/src/components/`
- ✅ **Database queries** ONLY in `/src/server/api/routers/`

---

## Development Workflow

### Before Starting Any Task

1. **Read CLAUDE.md Section 1** - Critical rules
2. **Check if similar feature exists** - Search for patterns
3. **Understand the data model** - Check Prisma schema
4. **Plan your approach** - List files you'll modify

### Development Loop

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes (follow patterns below)

# 3. ALWAYS verify after changes
npx tsc --noEmit      # TypeScript check
npm run build         # Build verification
npm run lint          # Linting check

# 4. Commit (ONLY when asked by user/Kyle)
git add .
git commit -m "feat: your feature description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Pre-Commit Hooks

**The codebase has automated quality gates** - commits will be blocked if:
- TypeScript errors exist
- Build fails
- Linting errors exist
- Compliance rules violated (timezone, type safety, etc.)

**If pre-commit fails:**
```bash
# See what failed
cat .husky/pre-commit

# Fix the issues (DO NOT bypass hooks!)
npx tsc --noEmit  # Fix type errors
npm run lint --fix  # Auto-fix linting

# NEVER use --no-verify unless explicitly approved
```

---

## Codebase Navigation

### Finding Things Fast

```bash
# Find a route
find src/app -name "page.tsx" | grep providers

# Find a component
find src -name "*Provider*.tsx" | grep components

# Find where something is used
grep -r "useProvider" src/features --include="*.tsx"

# Find tRPC procedure
grep -r "createProvider" src/server/api/routers

# Find type definition
grep -r "type Provider" src/features/*/types
```

### Key Files to Bookmark

| Purpose | File Path | Why Important |
|---------|-----------|---------------|
| Database schema | `prisma/schema.prisma` | Source of truth for all data |
| tRPC root | `src/server/api/root.ts` | All API routes |
| Auth config | `src/lib/auth.ts` | Authentication/authorization |
| Route protection | `src/middleware.ts` | Who can access what |
| Timezone utils | `src/lib/timezone.ts` | **CRITICAL** - All date handling |
| Type extraction | `src/utils/api.ts` | How to get tRPC types |
| Dev rules | `CLAUDE.md` | **READ THIS FIRST** |

### Understanding Feature Context

**When working on a feature, ALWAYS read:**

```bash
# Example: Working on providers feature
cat src/features/providers/types/types.ts     # Domain types
cat src/features/providers/types/schemas.ts   # Validation
cat src/server/api/routers/providers.ts       # API endpoints
ls src/features/providers/components/          # Available components
```

---

## Adding Features

### Step 1: Database Schema (if needed)

```prisma
// prisma/schema.prisma
model YourNewModel {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
npx prisma generate  # Regenerate client
npx prisma db push   # Update database (dev only)
# For production: npx prisma migrate dev --name add_your_model
```

### Step 2: tRPC API Endpoint

```typescript
// src/server/api/routers/yourFeature.ts
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const yourFeatureRouter = createTRPCRouter({
  // GET endpoint
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Authorization check FIRST
    if (!ctx.session.user) {
      throw new Error('Unauthorized');
    }

    // Database query
    return ctx.prisma.yourNewModel.findMany({
      where: { userId: ctx.session.user.id },
      include: { user: true }
    });
  }),

  // POST endpoint
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.yourNewModel.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
    }),
});
```

```typescript
// src/server/api/root.ts
import { yourFeatureRouter } from './routers/yourFeature';

export const appRouter = createTRPCRouter({
  // ... existing routers
  yourFeature: yourFeatureRouter,
});
```

### Step 3: Create Feature Hook

```typescript
// src/features/yourFeature/hooks/use-your-feature.ts
import { api } from '@/utils/api';

export function useYourFeature() {
  return api.yourFeature.getAll.useQuery();
}

// ❌ NEVER export types from hooks
// ✅ Extract types in components instead
```

### Step 4: Create Component

```typescript
// src/features/yourFeature/components/your-component.tsx
'use client';

import { type RouterOutputs } from '@/utils/api';
import { useYourFeature } from '../hooks/use-your-feature';

// ✅ Extract types from tRPC
type YourModel = RouterOutputs['yourFeature']['getAll'][number];

export function YourComponent() {
  const { data: items, isLoading } = useYourFeature();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {items?.map((item: YourModel) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Step 5: Create Route

```typescript
// src/app/(dashboard)/your-feature/page.tsx
import { YourComponent } from '@/features/yourFeature/components/your-component';

export default function YourFeaturePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold">Your Feature</h1>
      <YourComponent />
    </div>
  );
}
```

### Step 6: Verify Everything

```bash
npx tsc --noEmit && npm run build && npm run lint
```

---

## Type Safety & Patterns

### Extracting Types from tRPC (CRITICAL)

**✅ CORRECT Pattern:**
```typescript
import { type RouterOutputs } from '@/utils/api';

// Extract from query
type Provider = RouterOutputs['providers']['getById'];
type ProviderList = RouterOutputs['providers']['getAll'];
type SingleProvider = ProviderList[number];

// Extract from nested data
type Service = Provider['services'][number];

// Use in component
function MyComponent({ provider }: { provider: Provider }) {
  return <div>{provider.name}</div>;
}
```

**❌ WRONG - Creating Manual Types:**
```typescript
// ❌ NEVER DO THIS - Will drift from actual API
interface Provider {
  id: string;
  name: string;
  // This will break when API changes!
}
```

### Handling Prisma DateTime Fields

**✅ tRPC automatically deserializes DateTime → Date:**
```typescript
// From tRPC query
const { data: booking } = api.bookings.getById.useQuery({ id });

// ✅ startTime is already a Date object!
booking.startTime.toLocaleDateString()

// ❌ NEVER use parseUTC on tRPC data
parseUTC(booking.startTime) // Wrong! It's already a Date
```

**✅ Use parseUTC only for string inputs:**
```typescript
// User form input (string)
const dateString = formData.get('date');
const date = parseUTC(dateString); // ✅ Correct

// URL parameter (string)
const dateParam = searchParams.get('date');
const date = parseUTC(dateParam); // ✅ Correct
```

### Handling Prisma Decimal Fields

```typescript
// Prisma returns Decimal type for price fields
const service = await prisma.service.findUnique(...);

// ✅ Convert to number for display
<div>R{Number(service.defaultPrice)}</div>

// ❌ NEVER render Decimal directly
<div>R{service.defaultPrice}</div> // Error: Can't render Decimal
```

### Prisma JSON Fields

```typescript
// Define schema for JSON field validation
const metadataSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// In tRPC procedure
return ctx.prisma.model.findMany({
  select: {
    metadata: true, // JsonValue type
  },
});

// In component - validate and convert
const metadata = metadataSchema.parse(data.metadata);
```

---

## Compliance & Quality

### Timezone Handling (CRITICAL)

**Rules:**
- Database stores ALL dates in **UTC**
- South Africa timezone: **Africa/Johannesburg (UTC+2)**
- Users see dates in **SAST (South Africa Standard Time)**

**✅ CORRECT Usage:**
```typescript
import { nowUTC, startOfDaySAST, endOfDaySAST, formatSAST } from '@/lib/timezone';

// Get current UTC time
const now = nowUTC();

// Date ranges for queries
const startDate = startOfDaySAST(userSelectedDate);
const endDate = endOfDaySAST(userSelectedDate);

// Queries use UTC
const bookings = await prisma.booking.findMany({
  where: {
    startTime: {
      gte: startDate,  // Already UTC from startOfDaySAST
      lte: endDate,
    },
  },
});

// Display to user in SAST
formatSAST(booking.startTime, 'PPP') // "March 15, 2024"
```

**❌ FORBIDDEN:**
```typescript
// ❌ NEVER use these directly
new Date()           // Use nowUTC() instead
Date.now()           // Use nowUTC() instead
new Date(string)     // Use parseUTC(string) instead
```

**See:** `docs/compliance/TIMEZONE-GUIDELINES.md` for complete patterns

### Logging & PHI Protection

```typescript
import { logger, sanitizeEmail, sanitizeName } from '@/lib/logger';

// ✅ CORRECT - Sanitize PHI
logger.info('User login attempt', {
  email: sanitizeEmail(user.email),  // 'j***@example.com'
  name: sanitizeName(user.name),     // 'J*** D***'
});

// ❌ FORBIDDEN - Exposing PHI
console.log('User:', user.email);  // ❌ Security violation
logger.info('Booking created', { patientPhone: booking.phone }); // ❌ PHI exposure
```

**See:** `docs/compliance/LOGGING.md`

### Quality Checklist

**Before every commit:**
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] No `console.log` statements (use `logger` instead)
- [ ] No explicit `any` types (except in type guards)
- [ ] Timezone utilities used for all date handling
- [ ] PHI is sanitized in logs

---

## Common Tasks

### Task 1: Add New Field to Existing Model

```bash
# 1. Update schema
code prisma/schema.prisma

# 2. Add field
model Provider {
  # ... existing fields
  newField String?
}

# 3. Regenerate and push
npx prisma generate
npx prisma db push

# 4. Update tRPC endpoint (if needed)
# src/server/api/routers/providers.ts
# Add newField to select or include

# 5. Use in component
# Type automatically includes newField!
provider.newField // ✅ Typed automatically
```

### Task 2: Create New Page Route

```bash
# 1. Create page file
mkdir -p src/app/\(dashboard\)/my-new-page
touch src/app/\(dashboard\)/my-new-page/page.tsx

# 2. Add to middleware protection (if needed)
# src/middleware.ts - Add route pattern

# 3. Add navigation link
# src/components/navigation.tsx or relevant nav component

# Route is now available at: /my-new-page
```

### Task 3: Add Form with Validation

```typescript
// 1. Define Zod schema
// src/features/myFeature/types/schemas.ts
export const myFormSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  date: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') return parseUTC(val);
    return val;
  }),
});

// 2. Create tRPC mutation
// src/server/api/routers/myFeature.ts
import { myFormSchema } from '@/features/myFeature/types/schemas';

create: protectedProcedure
  .input(myFormSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.myModel.create({
      data: input,
    });
  }),

// 3. Create form component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(myFormSchema),
});

// 4. Submit via tRPC
const createMutation = api.myFeature.create.useMutation();

const onSubmit = (data) => {
  createMutation.mutate(data, {
    onSuccess: () => toast({ title: 'Success!' }),
  });
};
```

### Task 4: Debug Type Errors

```bash
# 1. Check tRPC router return type
cat src/server/api/routers/yourRouter.ts

# 2. Verify Prisma query matches what you expect
npx prisma studio  # Inspect data structure

# 3. Extract actual type from tRPC
# In component:
import { type RouterOutputs } from '@/utils/api';
type ActualType = RouterOutputs['router']['procedure'];

# 4. Hover over type in VS Code to see inferred shape

# 5. Check if you're using correct type extraction
# ✅ [number] for array items
# ✅ ['fieldName'] for nested objects
```

### Task 5: Add Database Relation

```prisma
// 1. Add relation in schema
model Provider {
  id       String    @id @default(cuid())
  services Service[]  // One-to-many
}

model Service {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id])

  @@index([providerId])  // Important for query performance!
}

// 2. Regenerate and push
npx prisma generate
npx prisma db push

// 3. Query with include
return ctx.prisma.provider.findMany({
  include: {
    services: true,  // Now services are included!
  },
});

// 4. Access in component
provider.services.map((service) => service.name) // ✅ Fully typed
```

---

## Troubleshooting

### Build Fails

```bash
# 1. Clear build cache
rm -rf .next
npm run build

# 2. Check TypeScript
npx tsc --noEmit

# 3. Check for circular dependencies
npm run lint | grep "circular"

# 4. Verify Prisma client is generated
npx prisma generate
```

### Type Errors After Pulling Changes

```bash
# Someone updated the Prisma schema
npx prisma generate  # Regenerate types
npm run build        # Verify everything works
```

### "Module not found" Errors

```bash
# Check import paths use @/ alias
# ✅ import { api } from '@/utils/api'
# ❌ import { api } from '../../utils/api'

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### tRPC Query Not Working

```typescript
// 1. Verify router is exported in root.ts
// src/server/api/root.ts

// 2. Check procedure name matches
api.yourRouter.yourProcedure.useQuery()
//   ^^^^^^^^^^  ^^^^^^^^^^^^^
//   Router name  Procedure name

// 3. Enable query only when ready
api.providers.getById.useQuery(
  { id: providerId! },
  { enabled: !!providerId }  // Don't run if ID is undefined
);
```

### Database Queries Return Unexpected Data

```bash
# 1. Check Prisma Studio
npx prisma studio

# 2. Check your include/select
# Prisma only returns what you explicitly select!

return ctx.prisma.provider.findMany({
  include: {
    services: true,  # Must include to get services!
  },
});
```

### Pre-Commit Hook Fails

```bash
# See what failed
cat .husky/pre-commit

# Common fixes:
npx tsc --noEmit                    # Fix type errors
npm run lint --fix                  # Auto-fix linting
npx prettier --write "src/**/*.ts"  # Format files

# Check compliance violations
cat scripts/compliance/compliance-config.json
```

---

## Working with Kyle & Claude Code

### Code Review Expectations

**Kyle (and Claude) will check for:**
- ✅ Proper type extraction from tRPC (no manual types)
- ✅ Timezone utilities used correctly
- ✅ No `console.log` statements
- ✅ PHI sanitization in logs
- ✅ No `any` types (except type guards)
- ✅ Feature isolation (no cross-feature imports)
- ✅ Database queries only in tRPC routers

### Asking Questions

**Good questions:**
- "Which tRPC router should I add this new endpoint to?"
- "Is there an existing pattern for this feature I should follow?"
- "Should this field be optional or required in the database?"
- "What timezone should I use for this date field?" (Always UTC in DB!)
- "Does this need to be behind authentication?"

**Questions to avoid:**
- "Can I use a different state library?" (No - stick to tRPC/React Query)
- "Should I create manual types for this?" (No - extract from tRPC)
- "Can I skip the build check?" (No - always verify)

### Git Workflow with Kyle

```bash
# 1. Stay synced with master
git checkout master
git pull origin master

# 2. Create feature branch from master
git checkout -b feature/your-feature

# 3. Regular commits as you work
git add .
git commit -m "feat: implement xyz"

# 4. Keep branch updated with master (rebase preferred)
git checkout master
git pull origin master
git checkout feature/your-feature
git rebase master

# 5. When ready, push and create PR
git push origin feature/your-feature

# 6. Kyle reviews → merge to master
```

**Important:**
- Always create PRs from feature branches to `master`
- Never commit directly to `master`
- Keep feature branches small and focused
- Rebase on master frequently to avoid conflicts
- Pre-commit hooks will block bad commits (don't bypass!)

### Using Claude Code

Kyle uses Claude Code extensively for development. You can use it too:

```bash
# Install Claude Code CLI
npm install -g @anthropic/claude-code

# Claude reads CLAUDE.md for project rules
# All architectural patterns and compliance rules are there
```

**What Claude knows:**
- Full project architecture and patterns
- Type safety rules and timezone handling
- Compliance requirements (POPIA, PHI protection)
- Database schema and relationships
- How to extract types from tRPC

**Working with Claude:**
- Reference CLAUDE.md frequently
- Claude enforces all rules automatically
- Compliance checks run on every commit
- Claude can help debug build/type errors

---

## Feature Module Deep Dive

### Features Overview

| Feature | Purpose | Key Files |
|---------|---------|-----------|
| `admin` | Admin dashboard, provider management | `src/features/admin/`, `src/server/api/routers/admin.ts` |
| `auth` | Authentication, user sessions | `src/features/auth/`, `src/lib/auth.ts` |
| `billing` | Subscriptions, payments, invoicing | `src/features/billing/`, `src/server/api/routers/billing.ts` |
| `calendar` | Availability, slots, scheduling | `src/features/calendar/`, `src/server/api/routers/calendar.ts` |
| `communications` | Email, SMS, WhatsApp | `src/features/communications/`, `src/lib/communications/` |
| `invitations` | Provider/organization invites | `src/features/invitations/`, `src/server/api/routers/invitations.ts` |
| `organizations` | Organization management, locations | `src/features/organizations/`, `src/server/api/routers/organizations.ts` |
| `profile` | User profiles, settings | `src/features/profile/`, `src/server/api/routers/profile.ts` |
| `providers` | Provider profiles, services, requirements | `src/features/providers/`, `src/server/api/routers/providers.ts` |
| `reviews` | Provider ratings and reviews | `src/features/reviews/`, `src/server/api/routers/reviews.ts` |
| `settings` | User and system settings | `src/features/settings/`, `src/server/api/routers/settings.ts` |

### Understanding Calendar System

**Key Concepts:**
1. **Availability** - Time slots providers/organizations create
2. **Slots** - Individual bookable time periods derived from availability
3. **Bookings** - Confirmed appointments in slots

**Flow:**
```
Provider creates Availability
  → System generates Slots (15-60 min intervals)
    → Patient books Slot
      → Booking created, Slot marked unavailable
```

**Important Rules:**
- Slots are billed regardless of booking (not bookings themselves)
- Organization-created availability requires provider acceptance
- Provider availability is auto-accepted
- Google Calendar sync is bidirectional

**Key Files:**
```bash
src/features/calendar/
├── components/availability/  # Availability management UI
├── components/booking/       # Booking flow components
├── hooks/                    # Calendar-related tRPC hooks
└── lib/timezone.ts          # CRITICAL - All date utilities

src/server/api/routers/calendar.ts  # Calendar API endpoints
```

### Understanding Provider System

**Provider Types:**
1. **Independent** - Solo practitioners, online only
2. **Organization-Associated** - Work at physical locations

**Provider Lifecycle:**
```
Registration
  → Requirements submission (documents, certifications)
    → Admin review
      → Approval/Rejection
        → Trial period
          → Active subscription
```

**Requirements System:**
- Each provider type has specific requirements
- Files uploaded to Vercel Blob storage
- Admin approval workflow with rejection reasons
- All changes audited (POPIA compliance)

**Key Files:**
```bash
src/features/providers/
├── components/profile/            # Provider profile views/edits
├── components/provider-profile/   # Public provider profile
├── components/requirement-submission-card.tsx
├── hooks/use-provider-requirements.ts
└── types/                         # Provider type definitions

src/server/api/routers/providers.ts  # Provider API
```

### Understanding Billing System

**Billing Models:**
1. **Slot-based** - Providers pay per availability slot created
2. **Tiered overage** - Base allocation + tiered pricing for additional slots
3. **Organization billing** - Organization pays for all members

**Payment Flow:**
```
Slot created
  → Billing calculation
    → Invoice generation
      → Payment processing
        → Subscription status update
```

**Important:**
- Billing happens regardless of whether slots are booked
- Decimal.js used for precise financial calculations
- All financial data is audited
- Timezone-critical for billing periods

**Key Files:**
```bash
src/features/billing/
├── components/subscription/    # Subscription management UI
├── components/payment/         # Payment processing
└── lib/billing-calculator.ts   # Billing logic

src/server/api/routers/billing.ts  # Billing API
```

---

## Advanced Patterns

### Optimistic Updates with tRPC

```typescript
// Instant UI feedback before server response
const utils = api.useUtils();

const createMutation = api.providers.create.useMutation({
  onMutate: async (newProvider) => {
    // Cancel outgoing queries
    await utils.providers.getAll.cancel();

    // Snapshot current data
    const previous = utils.providers.getAll.getData();

    // Optimistically update
    utils.providers.getAll.setData(undefined, (old) => {
      return old ? [...old, { id: 'temp', ...newProvider }] : [];
    });

    // Return rollback data
    return { previous };
  },
  onError: (err, newProvider, context) => {
    // Rollback on error
    utils.providers.getAll.setData(undefined, context?.previous);
  },
  onSettled: () => {
    // Refetch to ensure sync
    void utils.providers.getAll.invalidate();
  },
});
```

### Handling Transactions

```typescript
// ALWAYS use transactions for multi-table operations
export const bookingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Lock the slot
        const slot = await tx.slot.findUnique({
          where: { id: input.slotId },
        });

        if (!slot || slot.status !== 'AVAILABLE') {
          throw new Error('Slot unavailable');
        }

        // 2. Create booking
        const booking = await tx.booking.create({
          data: {
            slotId: input.slotId,
            userId: ctx.session.user.id,
            status: 'PENDING',
          },
        });

        // 3. Update slot status
        await tx.slot.update({
          where: { id: input.slotId },
          data: { status: 'BOOKED', bookingId: booking.id },
        });

        return booking;
      }, {
        maxWait: 10000,  // Max time to wait for transaction start
        timeout: 20000,  // Max transaction execution time
      });
    }),
});
```

### Pagination Pattern

```typescript
// Server-side
export const providersRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.provider.findMany({
        take: input.limit + 1,  // Fetch one extra to check if there's more
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),
});

// Client-side
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  api.providers.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

// Render
<div>
  {data?.pages.map((page) =>
    page.items.map((item) => <div key={item.id}>{item.name}</div>)
  )}
  {hasNextPage && (
    <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
      Load More
    </button>
  )}
</div>
```

### Error Handling Patterns

```typescript
// tRPC error handling
import { TRPCError } from '@trpc/server';

export const providersRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      // Authorization check
      if (provider.userId !== ctx.session.user.id && !ctx.session.user.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this provider',
        });
      }

      return provider;
    }),
});

// Client-side error handling
const { data, error, isError } = api.providers.getById.useQuery({ id });

if (isError) {
  if (error.data?.code === 'NOT_FOUND') {
    return <div>Provider not found</div>;
  }
  if (error.data?.code === 'FORBIDDEN') {
    return <div>Access denied</div>;
  }
  return <div>Something went wrong</div>;
}
```

---

## Testing

### E2E Testing with Playwright

**Test Structure:**
```bash
e2e/
├── tests/
│   ├── auth/                 # Authentication flows
│   ├── booking/              # Booking flows
│   ├── provider/             # Provider management
│   └── calendar/             # Calendar operations
└── playwright.config.ts
```

**Running Tests:**
```bash
# All tests
npm run test

# Specific feature
npm run test:auth
npm run test:booking
npm run test:provider

# With UI
npm run test:ui

# Debug mode
npm run test:debug
```

**Writing Tests:**
```typescript
// e2e/tests/providers/create-provider.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Provider Creation', () => {
  test('should create new provider profile', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Navigate to provider creation
    await page.goto('/providers/create');

    // Fill form
    await page.fill('[name="name"]', 'Dr. Test Provider');
    await page.selectOption('[name="type"]', 'INDEPENDENT');

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    await expect(page).toHaveURL('/providers/profile');
    await expect(page.locator('text=Dr. Test Provider')).toBeVisible();
  });
});
```

---

## CI/CD & Deployment

### Pre-Commit Validation

**Automated checks before every commit:**
```bash
# .husky/pre-commit runs:
1. TypeScript validation (npx tsc --noEmit)
2. Build verification (npm run build)
3. Linting (npm run lint)
4. Compliance checks (timezone, type safety, PHI protection)
```

**If pre-commit fails:**
1. Read error output carefully
2. Fix identified issues
3. Re-attempt commit
4. **NEVER use --no-verify** without Kyle's approval

### Deployment Checklist

**Before merging to master:**
- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Types valid: `npx tsc --noEmit`
- [ ] Linting clean: `npm run lint`
- [ ] No console.logs in code
- [ ] Compliance check passes: `npm run compliance:check`
- [ ] PR reviewed and approved by Kyle

**Production deployment (Kyle handles this):**
1. Merge to master
2. Vercel automatically deploys
3. Database migrations run: `npm run db:migrate`
4. Verify deployment: Check Vercel dashboard
5. Smoke test: Test critical flows (auth, booking)

**Environment Variables:**
See `docs/compliance/DEPLOYMENT.md` for complete list of required env vars.

---

## Quick Reference Cheat Sheet

### Daily Commands
```bash
# Start development
npm run dev

# Check everything is OK
npx tsc --noEmit && npm run build && npm run lint

# Database tools
npx prisma studio              # GUI for database
npx prisma generate            # Regenerate types after schema change
npx prisma db push             # Push schema changes (dev only)

# Testing
npm run test                   # Run all tests
npm run test:ui                # Test with UI
```

### Common File Patterns
```bash
# Find route
find src/app -name "page.tsx" | grep [keyword]

# Find component
find src -name "*[ComponentName]*.tsx"

# Find tRPC procedure
grep -r "[procedureName]" src/server/api/routers

# Find where something is used
grep -r "useSomething" src --include="*.tsx"
```

### Type Extraction Quick Reference
```typescript
import { type RouterOutputs } from '@/utils/api';

// Single item
type Provider = RouterOutputs['providers']['getById'];

// Array of items
type ProviderList = RouterOutputs['providers']['getAll'];
type SingleProvider = ProviderList[number];

// Nested item
type Service = Provider['services'][number];
```

### Timezone Quick Reference
```typescript
import { nowUTC, startOfDaySAST, endOfDaySAST, formatSAST, parseUTC } from '@/lib/timezone';

nowUTC()                        // Current UTC time
startOfDaySAST(date)           // Start of day in SAST → UTC
endOfDaySAST(date)             // End of day in SAST → UTC
formatSAST(date, 'PPP')        // Format UTC date as SAST
parseUTC(string)               // Parse string to UTC Date
```

---

## Next Steps

### Week 1 Goals
1. ✅ Complete environment setup
2. ✅ Read CLAUDE.md thoroughly
3. ✅ Explore codebase structure
4. ✅ Run development server successfully
5. 🎯 Make first small feature contribution
6. 🎯 Get PR reviewed and merged

### Week 2-4 Goals
1. 🎯 Take ownership of a feature module
2. 🎯 Understand database schema deeply
3. 🎯 Master tRPC type extraction patterns
4. 🎯 Contribute to 2-3 medium-sized features
5. 🎯 Start reviewing Kyle's PRs

### Monthly Goals
1. 🎯 Full feature independence
2. 🎯 Contribute to architecture decisions
3. 🎯 Help improve documentation
4. 🎯 Mentor new developers (future)

---

## Resources

### Documentation
- `CLAUDE.md` - **PRIMARY REFERENCE** - Development rules and patterns
- `docs/compliance/TYPE-SAFETY.md` - Type system patterns
- `docs/compliance/TIMEZONE-GUIDELINES.md` - Timezone handling
- `docs/compliance/LOGGING.md` - PHI protection and logging
- `docs/compliance/DEPLOYMENT.md` - Production deployment
- `docs/compliance/DEVELOPMENT-WORKFLOW.md` - Complete workflow guide

### External Resources
- [Next.js 14 App Router Docs](https://nextjs.org/docs/app)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Getting Help
1. **Check CLAUDE.md first** - Most answers are there
2. **Search existing code** - Find similar patterns
3. **Ask Kyle** - On Slack/Discord/preferred channel
4. **Use Claude Code** - Knows entire codebase and rules
5. **Check git history** - `git log -p [file]` shows changes
6. **Review closed PRs** - See how Kyle solved similar problems

---

## Welcome Aboard! 🚀

You're joining at an exciting time as MedBookings grows. The codebase is well-structured with strong architectural patterns and comprehensive compliance systems. Take your time to understand the foundations, and don't hesitate to ask questions.

**Remember:**
- Quality over speed - Get it right the first time
- Follow existing patterns - Consistency is key
- Verify everything - Build, type check, lint before commit
- Read CLAUDE.md - It's your north star
- Collaborate with Kyle - Two heads are better than one

**Let's build something amazing together!** 💪

---

*Document Version: 1.0*
*Last Updated: 2025-10-07*
*Maintained by: Kyle Govender*