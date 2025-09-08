# CLAUDE.md

This file provides guidance to Claude Code when working with the MedBookings repository.

## Code Analysis Guidelines

Before making any changes or suggestions:

1. **Scan the entire project structure** to understand the actual organization and patterns in use.
2. **Confirm framework and tooling** by examining package.json, config files, and existing code patterns.
3. **Identify actual conventions** used in this specific project rather than assuming standard practices.
4. **Validate assumptions** by checking the codebase evidence before proceeding with any recommendations.
5. **Always read entire files** otherwise, you don’t know what you don’t know, and will end up making mistakes, duplicating code that already exists, or misunderstanding the architecture.

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

## Critical Rules (Never Violate)

### File Operations

- **NEVER write code to files without explicit user approval**
- **NEVER start development servers** - always request user to handle server management
- **NEVER perform large refactors** unless explicitly instructed

### Implementation Standards

- **NEVER create dummy/placeholder implementations** - always build the actual functionality
- **NEVER skip libraries** claiming they don't work - incorrect syntax/patterns are usually the issue
- **NEVER give up on tasks** - identify root causes instead of trying random solutions

## Task Initialization Protocol

### 1. Understanding Phase

- **Require 100% clarity** before starting any task
- **Analyze current architecture** and identify files to modify
- **Ask follow-up questions** when confidence < 95%
- **Push back on vague/oversized tasks** - request breakdown into subtasks

### 2. Planning Phase

- **Create detailed Plan** including:
  - Architectural considerations
  - Edge cases identification
  - File modification list
  - Implementation approach
- **Get explicit Plan approval** from user before writing any code

### 3. Task Breakdown

- **Large tasks**: Break into logical milestones
- **Vague tasks**: Request clarification or guide user through breakdown
- **Complex scope**: Identify subtasks to prevent errors and wasted effort

## Development Workflow

### Library & Syntax Management

- **Always verify current syntax** for external libraries via:
  1. **Perplexity** (first preference)
  2. **Web search** (only if Perplexity unavailable)
- **Never assume library interfaces** unless 100% certain of stability
- **Research before implementation** especially when user specifies a library

### Quality Assurance

- **Run linting after major changes** to catch:
  - Syntax errors
  - Method usage issues
  - File corruption
  - Wrong method patterns
- **Test each milestone** before proceeding
- **Request confirmation** after completing logical checkpoints

### Code Organization

- **Separate files** wherever appropriate
- **Follow best practices**:
  - Clear variable naming
  - Modular functions
  - Manageable file sizes
  - Comprehensive commenting
- **Optimize for readability** - code is read more than written

## Implementation Principles

### Confidence Threshold

- **95% Rule**: Only implement when 95% confident
- **Below threshold**: Ask clarifying questions
- **Never assume**: Better to confirm than implement incorrectly

### Completion Standards

- **Display modified files list** with explanations after task completion
- **Implement completely** - no "this is how it would look" examples
- **Commit after milestones** once user confirms functionality

### Problem Resolution

- **Root cause analysis** instead of trial-and-error
- **Systematic debugging** when facing repeated issues
- **Use specified libraries** - user chose them for a reason

## Design & User Experience

### UI/UX Standards

- **Create designs that are**:
  - Aesthetically pleasing
  - Intuitive and easy to use
  - Following UI/UX best practices
- **Pay attention to**:
  - Interaction patterns
  - Micro-interactions
  - Smooth transitions
  - User delight factors

### Technical Excellence

- **Apply expertise across**:
  - Software architecture
  - System design
  - Development patterns
  - UI/UX principles
  - Performance optimization

## Workflow Summary

1.  RECEIVE TASK

2.  ASSESS CLARITY (>95% confidence?)
    ─ NO → Ask questions
    ─ YES → Continue

3.  UNDERSTAND ARCHITECTURE

4.  CREATE PLAN

5.  GET APPROVAL

6.  VERIFY LIBRARY SYNTAX

7.  IMPLEMENT

8.  LINT & TEST

9.  REQUEST MILESTONE CONFIRMATION

10. COMMIT (if approved)

11. CONTINUE OR COMPLETE

## Quick Reference Checklist

Before starting:

- [ ] Task clarity 100%?
- [ ] Architecture understood?
- [ ] Plan created and approved?

During development:

- [ ] Library syntax verified?
- [ ] Linting run after changes?
- [ ] Full implementation (no dummies)?
- [ ] Code readable and modular?

After milestones:

- [ ] Files list displayed?
- [ ] User confirmation received?
- [ ] Ready to commit or continue?

## Red Flags to Avoid

1. **"I'll skip this library"** → Fix syntax instead
2. **"Here's how it would work"** → Implement it fully
3. **"Let me try another approach"** (repeatedly) → Find root cause
4. **Writing files without asking** → Always get approval first
5. **Starting servers** → User handles this
6. **Assuming library knowledge** → Verify current syntax

_Remember: You are a highly skilled polyglot developer with decades of experience. Apply this expertise while following these guidelines to deliver excellent, working solutions._

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

| Type Category  | Source | Import Pattern                            |
| -------------- | ------ | ----------------------------------------- |
| Database Enums | Prisma | `import { Status } from '@prisma/client'` |
| Domain Logic   | Manual | `/features/*/types/types.ts`              |
| API Responses  | tRPC   | `RouterOutputs['router']['procedure']`    |

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
        include: {
          /* relations */
        },
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
};

// 2. tRPC Procedure - queries database
getAll: publicProcedure.query(async ({ ctx }) => {
  return ctx.prisma.provider.findMany({
    include: { user: true, services: true },
  });
});

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

| Provider Type           | Availability       | Billing     |
| ----------------------- | ------------------ | ----------- |
| Independent             | Online only        | Self-billed |
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

| Creator      | Initial Status | Billing                         |
| ------------ | -------------- | ------------------------------- |
| Provider     | ACCEPTED       | Provider subscription           |
| Organization | PENDING        | Organization (after acceptance) |

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
};
```

### File Conventions

- kebab-case naming
- Direct imports (no barrels)
- Single quotes, semicolons, arrow functions
- 2 spaces, 100 char max lines

## MCP Tool Usage

- **PostgreSQL**: Database queries and verification via `mcp__postgres-server__`
- **Filesystem**: File operations via `mcp__filesystem-server__`
- **IDE**: Diagnostics via `mcp__ide__`
- **Playwright**: E2E testing via `mcp__playwright__`
- Always prefer MCP tools over bash commands when available

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

The project uses a streamlined workflow system with commands located in `.claude/commands/`. Follow these patterns:

### Workflow Commands Location

Workflow commands in `.claude/commands/`:

- `feature-workflow.md` - Complete feature development flow
- `issue-workflow.md` - Complete issue resolution flow
- `tasks-process-enhanced.md` - Task implementation with backlog updates
- `quick-note-workflow.md` - Quick capture for ideas

### Folder Structure

/workflow/
├── backlog.md # Central task tracking
├── complete.md # Completed work archive
├── prds/ # Feature specifications
│ ├── [name]-prd.md # Product Requirements Document
│ └── [name]-prd-tasks.md # Implementation Tasks
└── issues/ # Issue specifications
├── [name]-issue.md # Issue Specification
└── [name]-issue-tasks.md # Resolution Tasks

### Workflow Triggers

#### Feature Development

**Trigger**: `feature required: [description]`
**Process**:

1. Creates PRD in `/workflow/prds/[feature-name]-prd.md`
2. Generates tasks in `/workflow/prds/[feature-name]-prd-tasks.md`
3. Automatically adds entry to `/workflow/backlog.md`
4. Asks priority questions for categorization

#### Issue Resolution

**Trigger**: `issue fix required: [description]`
**Process**:

1. Creates issue spec in `/workflow/issues/[issue-name]-issue.md`
2. Generates tasks in `/workflow/issues/[issue-name]-issue-tasks.md`
3. Automatically adds entry to `/workflow/backlog.md`
4. Asks severity questions for prioritization

#### Task Implementation

**Trigger**: `implement feature tasks from: [feature-name]-prd-tasks.md`
**Trigger**: `implement issue tasks from: [issue-name]-issue-tasks.md`
**Process**:

1. Creates appropriate git branch (`feature/` or `issue/`)
2. Implements each sub-task with user confirmation
3. Updates task file with `[x]` marks
4. Updates backlog.md when all tasks complete
5. Moves to complete.md after final confirmation

#### Quick Capture

**Trigger**: `quick feature note: [brief idea]`
**Trigger**: `quick issue note: [brief problem]`
**Process**:

- Adds lightweight entry to backlog.md
- Can be expanded to full spec later

### Workflow Quick Reference

| User Says                       | Creates       | Location            | Automatic Actions          |
| ------------------------------- | ------------- | ------------------- | -------------------------- |
| `feature required: [desc]`      | PRD + Tasks   | `/workflow/prds/`   | Adds to backlog.md         |
| `issue fix required: [desc]`    | Issue + Tasks | `/workflow/issues/` | Adds to backlog.md         |
| `implement feature tasks from:` | Updates tasks | In place            | Updates backlog → complete |
| `implement issue tasks from:`   | Updates tasks | In place            | Updates backlog → complete |
| `quick feature note:`           | None          | N/A                 | Quick entry in backlog.md  |
| `quick issue note:`             | None          | N/A                 | Quick entry in backlog.md  |

### Key Workflow Features

- **Automatic Backlog Management**: All features/issues auto-added to backlog.md
- **User Confirmation Required**: Tasks marked complete only after user confirms satisfaction
- **Integrated Git Flow**: Automatic branch creation and PR generation
- **Progress Tracking**: Visual `[x]` marks in task files and backlog
- **Historical Archive**: Completed work moves to complete.md with details

### Execution Modes

- **Default Mode**: Interactive with confirmation at each step
- **YOLO Mode**: Add "yolo mode" to implementation commands for continuous execution
  - Still requires confirmation before marking complete
  - Runs `npm run build` until successful
  - Uses Playwright MCP for e2e testing

### Important Notes

- No manual backlog management needed - system handles automatically
- User satisfaction confirmation required before any completion marks
- All paths relative to project root
- Files stay in `/workflow/prds/` and `/workflow/issues/` (no subdirectories)
