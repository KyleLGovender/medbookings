# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests

### Database Operations

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open database GUI
- `npx prisma db seed` - Seed database with sample data

### Docker Development

- `docker compose up` - Start PostgreSQL database locally

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query for server state
- **Validation**: Zod schemas
- **Testing**: Jest with Testing Library

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
- **ServiceProvider**: Healthcare providers offering services (1:1 with User)

#### Service Provider Ecosystem

- **ServiceProviderType**: Categories like "General Practitioner", "Physiotherapist"
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

- **ServiceProvider**: PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE
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

### Data Layer Architecture

- **API Routes**: Located in `/app/api/` - handle HTTP requests only
- **Business Logic**: Located in `/features/{feature}/lib/actions.ts` (Next.js server actions)
- **Client Hooks**: Located in `/features/{feature}/hooks/` using TanStack Query
- **Query Keys**: Use `[resource, id]` format for cache keys
- **Hook Callbacks**: Hooks accept optional onSuccess/onError callbacks

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
- **Polymorphic Relations**: Subscriptions can belong to ServiceProvider, Organization, or Location
- **Audit Trails**: Organization membership changes are fully tracked

### Code Quality Standards

- **95% Confidence Rule**: Only implement when 95% confident of approach
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
