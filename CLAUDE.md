# CLAUDE.md

This file provides guidance to Claude Code when working with the MedBookings repository.

## Command Execution Policy

**NEVER execute directly:**
- `npm run build`, `npm run lint`, `npm run format`, `npm run dev`, `npm run test`
- Any npm scripts or long-running/interactive processes

**Safe to execute:**
- Simple file operations, `grep`, `rg` (ripgrep)

### Database Commands (Reference)
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema (development)
- `npx prisma studio` - Open database GUI
- `docker compose up` - Start PostgreSQL locally
- `npx prisma migrate dev` - Create migration (NEVER run - requires interaction)
- `npx prisma migrate deploy` - Apply migrations (production)
- `npx prisma migrate reset` - Reset database (NEVER run in production)

## Core Development Principles

- **95% Confidence Rule**: Only implement when 95% confident, ask questions if below threshold
- **Task Completion**: Display modified files list with explanations
- **Git Commits**: Commit after each subtask with descriptive messages
- **Server Management**: Never start dev server - request user to do it

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **API**: tRPC (type-safe, replacing REST)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State**: tRPC + TanStack Query
- **Validation**: Zod schemas
- **Testing**: Playwright (e2e only)

## Type System Architecture

### Type Source Rules

| Type Category | Source | Import Pattern |
|--------------|--------|----------------|
| Database Enums | Prisma | `import { Status } from '@prisma/client'` |
| Domain Logic | Manual | `/features/*/types/types.ts` |
| API Responses | tRPC | `RouterOutputs['router']['procedure']` |

### Implementation Patterns

#### Component Type Extraction
```typescript
// ✅ CORRECT - Extract types in components
import { type RouterOutputs } from '@/utils/api';

type AdminProvider = RouterOutputs['admin']['getProviderById'];
type ProviderList = RouterOutputs['admin']['getProviders'];
type SingleProvider = ProviderList[number];
type NestedType = NonNullable<AdminProvider>['relationName'][number];
```

#### Hook Pattern (Simple Wrappers)
```typescript
// ✅ CORRECT - No type exports from hooks
export function useAdminProvider(id: string) {
  return api.admin.getProviderById.useQuery({ id });
}
// ❌ NEVER export types from hooks
```

#### tRPC Procedure Pattern
```typescript
// Server procedures return Prisma results directly
export const adminRouter = createTRPCRouter({
  getProviderById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: { /* relations */ }
      }); // Type automatically inferred
    }),
});
```

### Available Prisma Enums

Always import directly from `@prisma/client`:
- **User**: `UserRole`
- **Provider**: `ProviderStatus`, `Languages`, `RequirementsValidationStatus`
- **Organization**: `OrganizationStatus`, `OrganizationRole`, `MembershipStatus`
- **Calendar**: `AvailabilityStatus`, `BookingStatus`, `SchedulingRule`, `SlotStatus`
- **Billing**: `SubscriptionStatus`, `PaymentStatus`, `BillingInterval`

## Data Flow Architecture

### Critical Pattern: Client → tRPC → Database

```typescript
// 1. Client Hook - calls tRPC
export const useProviders = () => {
  return api.providers.getAll.useQuery();
}

// 2. tRPC Procedure - queries database
getAll: publicProcedure.query(async ({ ctx }) => {
  return ctx.prisma.provider.findMany({
    include: { user: true, services: true }
  });
})

// 3. Server Action - business logic only
export async function createProvider(data) {
  // Validation, notifications only
  await sendEmail(data.email);
  return { success: true, providerId: data.id }; // Metadata only
}
```

**Rules:**
- Client hooks NEVER import Prisma
- Database queries ONLY in tRPC procedures
- Server actions return metadata only
- Single database query per endpoint

### Legacy REST Exceptions
Only in `/app/api/`: File uploads, Webhooks, Third-party integrations, NextAuth routes

## Project Structure

```
src/
├── app/              # Next.js routes
├── features/         # Feature modules
│   └── [feature]/
│       ├── components/   # Feature UI
│       ├── hooks/        # tRPC hooks
│       ├── lib/          # Server actions
│       └── types/        # Domain types
│           ├── types.ts     # Enums, business logic
│           ├── schemas.ts   # Zod schemas
│           └── guards.ts    # Type guards
├── server/api/routers/   # tRPC procedures (DB here)
└── components/           # Shared UI
```

### tRPC Router Files
Located in `/server/api/routers/`:
- `admin.ts` - Admin procedures
- `providers.ts` - Provider management
- `organizations.ts` - Organization management
- `calendar.ts` - Booking/availability
- `auth.ts` - Authentication procedures

## Business Rules

### Provider-Organization Relationships

| Provider Type | Availability | Billing |
|--------------|--------------|---------|
| Independent | Online only | Self-billed |
| Organization-Associated | Physical locations | Per creator |

- Exclusive scheduling: ONE entity per time period

### Status Flows

```
PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE
                ↓            ↓       ↓
             REJECTED    EXPIRED  SUSPENDED
```

- Provider approval requires ALL requirements approved
- Rejection reasons mandatory
- All admin actions logged with context

### Availability System

| Creator | Initial Status | Billing |
|---------|---------------|---------|
| Provider | ACCEPTED | Provider subscription |
| Organization | PENDING | Organization (after acceptance) |

- Slot-based billing (not booking-based)
- Base slots + tiered overage pricing

### Booking System

**Types:** Registered users, Guests (name/contact), Staff-created
**Flow:** PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
**Rule:** Can require provider confirmation

### Integrations

**Google Calendar:**
- Bidirectional sync
- External events block slots
- Auto Google Meet links
- Webhook support

**Communications:**
- Email, SMS, WhatsApp
- Automated triggers
- Guest support

## Authentication

- Use `getCurrentUser()` not `getServerSession()`
- Check `['ADMIN', 'SUPER_ADMIN']` roles
- Pattern: getCurrentUser → role check → 401/500 handling

## Development Standards

### Forms
- React Hook Form + Zod
- `z.nativeEnum(PrismaEnum)` for enums
- `z.record()` for nested data

### Optimistic Updates
Pattern: onMutate → onError (rollback) → onSuccess (invalidate)
See admin hooks for implementation

```typescript
// Example: Cancel queries → Snapshot → Update → Rollback on error
onMutate: async (variables) => {
  await queryClient.cancelQueries(['key']);
  const previous = queryClient.getQueryData(['key']);
  queryClient.setQueryData(['key'], optimisticData);
  return { previous };
}
```

### File Conventions
- kebab-case naming
- Direct imports (no barrels)
- Single quotes, semicolons, arrow functions
- 2 spaces, 100 char max lines

## Testing Strategy
- **E2E Tests**: Use Playwright MCP tools, never bash commands
- **Test Files**: Located in `/tests/e2e/`
- **Run Tests**: Request user to run, never execute directly
- **Test Pattern**: Test critical user flows only

## Error Handling Patterns

### tRPC Error Handling
```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Resource not found',
});
```

### API Response Pattern
```typescript
// Success
{ success: true, data: result }
// Error
{ success: false, error: 'Error message' }
```

## Critical Policies

### NO MOCK DATA
- NEVER use mock/test/placeholder data
- Use loading states, empty states, error messages
- Always real data from database/APIs

### CLIENT/SERVER SEPARATION
- Zero Prisma imports in client code
- Database access only through tRPC
- Automatic type inference

## Forbidden Patterns

```typescript
// ❌ Duplicate Prisma enums
export enum ProviderStatus { PENDING = 'PENDING' }

// ❌ Import Prisma in client
import { prisma } from '@/lib/prisma'

// ❌ Export types from hooks
export type AdminProvider = RouterOutputs['admin']['getProviders'];

// ❌ Use fetch for APIs
fetch('/api/providers')

// ❌ Return DB from server actions
return prisma.provider.findMany()

// ❌ Use any types
(provider: any) => {}

// ❌ Multiple DB queries
const result = await createProvider(input);
return ctx.prisma.provider.findUnique({ id: result.id });
```

## Performance Guidelines
- Use `React.memo` for expensive components
- Implement pagination for large lists
- Use optimistic updates for better UX
- Lazy load routes and components
- Cache tRPC queries appropriately

## Debugging
- Check browser console for client errors
- Check terminal for server errors
- Use `console.log` for debugging (remove before commit)
- Check Network tab for API calls
- Verify database with `npx prisma studio`

## Post-Development

- Request user: `npm run fix` for linting
- Run `npm run build` before PRs
- Use Playwright MCP for e2e testing


## Development Workflow System

The project uses a structured workflow system with commands located in `.claude/commands/`. Follow these patterns:

### Workflow Commands Location
Workflow commands in `.claude/commands/`:
- See `prd-specification.md` for feature development
- See `issue-specification.md` for bug fixes
- See `tasks-list.md` for task generation
- See `tasks-process.md` for task execution

### Folder Structure
```
/workflow/
├── docs/                    # General documentation
│   └── backlog.md          # Project backlog
├── issues/
│   ├── backlog/            # Active issue specs and tasks
│   │   ├── [name]-issue.md
│   │   └── [name]-issue-tasks.md
│   └── complete/           # Completed issues archive
│       ├── [name]-issue.md
│       └── [name]-issue-tasks.md
└── prds/
    ├── backlog/            # Active PRDs and task files
    │   ├── [name]-prd.md       # Product Requirements Document
    │   └── [name]-prd-tasks.md # Implementation Tasks
    └── complete/           # Completed PRDs archive
        ├── [name]-prd.md
        └── [name]-prd-tasks.md
```

### Workflow Triggers & File Management

#### Creating New Features
**Trigger**: "I need a feature for [description]"
**Process**:
1. Read `.claude/commands/prd-specification.md`
2. Ask clarifying questions
3. Generate PRD: `/workflow/prds/backlog/[kebab-name]-prd.md`
4. Wait for "Complete PRD" confirmation
5. When prompted "Generate tasks", create: `/workflow/prds/backlog/[kebab-name]-prd-tasks.md`

#### Reporting Bugs/Issues
**Trigger**: "There's a bug where [description]" or "Issue: [description]"
**Process**:
1. Read `.claude/commands/issue-specification.md`
2. Ask clarifying questions
3. Generate spec: `/workflow/issues/backlog/[kebab-name]-issue.md`
4. Wait for "Complete Issue Specification" confirmation
5. Generate tasks: `/workflow/issues/backlog/[kebab-name]-issue-tasks.md`

#### Generating Task Lists
**Trigger**: "Generate task list from [specification file]"
**Process**:
1. Read `.claude/commands/tasks-list.md`
2. Read the specification file (PRD or Issue)
3. Generate high-level tasks, wait for "Go"
4. Add sub-tasks
5. Save as separate `-tasks.md` file in same folder

#### Processing Tasks
**Trigger**: "Process tasks from [task file]"
**Process**:
1. Read `.claude/commands/tasks-process.md`
2. Read tasks from `-tasks.md` file
3. Update checkboxes: `- [ ]` → `- [x]` as completed
4. Create git branch: `feature/[name]` or `issue/[name]`
5. Commit after each sub-task

#### Moving to Complete
**Trigger**: "Mark [feature/issue] as complete"
**Process**:
- Move both files (PRD+tasks or issue+tasks) to `/complete/` subfolder
- All task checkboxes should show `- [x]`

### Quick Reference
| User Says | Creates/Updates | Location |
|-----------|-----------------|----------|
| "I need a feature..." | `[name]-prd.md` | `/workflow/prds/backlog/` |
| "Generate tasks" (for PRD) | `[name]-prd-tasks.md` | `/workflow/prds/backlog/` |
| "There's a bug..." | `[name]-issue.md` + `-tasks.md` | `/workflow/issues/backlog/` |
| "Process tasks from..." | Updates checkboxes in `-tasks.md` | In place |
| "Mark X complete" | Moves both files | To `/complete/` subfolder |
| "Add to backlog..." | Updates `backlog.md` | `/workflow/docs/` |

