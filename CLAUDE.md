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

## Server Management

- Let the user run the dev server... never start the dev server yourself... just request the user to do it

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

### Type System Architecture ✅ **RECENTLY COMPLETED**

The MedBookings codebase uses a **bulletproof-react inspired type organization** with zero barrel exports:

#### File Structure
```
src/features/[feature-name]/types/
├── types.ts          # Main type definitions with comprehensive JSDoc
├── schemas.ts        # Zod validation schemas for runtime validation  
├── guards.ts         # Type guard functions for runtime type checking
```

#### Import Patterns
- ✅ **Direct imports**: `import { Type } from '@/features/calendar/types/types'`
- ❌ **Barrel exports**: `import { Type } from '@/features/calendar/types'` (not allowed)

#### Type Organization Standards
1. **File headers** with comprehensive documentation
2. **Enums** with proper JSDoc and consistent naming
3. **Base interfaces** for simple data structures
4. **Complex interfaces** with detailed examples and documentation
5. **Utility types** for type manipulation
6. **Prisma-derived types** for optimized database operations

#### Features with Standardized Types
- **Calendar**: `/src/features/calendar/types/` - Availability, scheduling, recurrence
- **Providers**: `/src/features/providers/types/` - Provider management, requirements
- **Organizations**: `/src/features/organizations/types/` - Organization management, locations
- **Admin**: `/src/features/admin/types/` - Admin operations, user management
- **Billing**: `/src/features/billing/types/` - Subscriptions, payments, invoicing
- **Invitations**: `/src/features/invitations/types/` - Invitation workflows

#### Global Types
- **API types**: `/src/types/api.ts` - Generic API response structures
- **Type guards**: `/src/types/guards.ts` - Common validation functions

#### Automated Enforcement
- **ESLint rules** prevent barrel exports and enforce naming conventions
- **TypeScript strict mode** ensures type safety
- **Custom linting rules** maintain architectural consistency

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

### Data Layer Architecture ✅ **RECENTLY MIGRATED TO tRPC**

- **tRPC API**: Type-safe end-to-end API using tRPC with server procedures
- **Server Procedures**: Located in `/lib/trpc/routers/` - handle type-safe API logic
- **Business Logic**: Located in `/features/{feature}/lib/actions.ts` (server actions) called by tRPC procedures
- **Client Hooks**: Located in `/features/{feature}/hooks/` using tRPC + TanStack Query
- **Type Safety**: Full end-to-end type safety from server to client
- **Legacy REST**: A few exceptions remain as REST API routes in `/app/api/`

#### CRITICAL: Data Access Separation

- **Client-side hooks NEVER import Prisma directly**
- **Hooks ONLY call tRPC procedures (or legacy API routes where applicable)**
- **Database access ONLY in server actions called by tRPC procedures**
- **Pattern**: Hook → tRPC Procedure → Server Action → Prisma

#### tRPC Data Flow Examples

```typescript
// ✅ CORRECT: Hook calls tRPC procedure
import { api } from '@/lib/trpc/client'

export const useProviders = () => {
  return api.providers.getAll.useQuery({
    // Optional input parameters
  })
}

// ✅ CORRECT: tRPC procedure calls server action
// /lib/trpc/routers/providers.ts
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { getProviders } from '@/features/providers/lib/actions'

export const providersRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await getProviders(input) // Server action
    }),
})

// ✅ CORRECT: Server action uses Prisma
// /features/providers/lib/actions.ts
export async function getProviders(input?: { limit?: number; offset?: number }) {
  return prisma.provider.findMany({
    take: input?.limit,
    skip: input?.offset,
  })
}

// ✅ CORRECT: Mutation with tRPC
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
```

#### Legacy REST API Exceptions

Some endpoints remain as REST APIs in `/app/api/`:
- File uploads (`/api/upload/*`)
- Webhook endpoints
- Third-party integrations
- NextAuth.js routes (`/api/auth/*`)

#### ❌ FORBIDDEN PATTERNS
```typescript
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
```

### Form Implementation Patterns

- **Validation**: React Hook Form with Zod schemas
- **Nested Data**: Use `z.record()` for nested structures (not arrays)
- **Complex Fields**: Use Controller pattern for complex form controls
- **State Management**: Components manage local `isSubmitting` state
- **Error Flow**: FormData → mutateAsync with try/catch → UI feedback
- **Selection Forms**: Avoid useFieldArray for simple selection forms

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
- **Database access ONLY in server actions (`/features/*/lib/actions.ts`) or API routes (`/app/api/`)**

### Correct Data Flow

1. **Client Hook** → calls API route or server action
2. **API Route** → calls server action (if needed)
3. **Server Action** → uses Prisma to access database
4. **Never skip steps** - maintain the separation

### Build Errors Indicate Wrong Pattern

- **If you get Prisma build errors in client code, you're doing it wrong**
- **Prisma should only be imported in server-side code**
- **Client code should use fetch() or server actions, never Prisma directly**
