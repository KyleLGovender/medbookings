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

### Key Implementation Notes

- **Slot-Based Billing**: All pricing is based on availability slots, not bookings
- **Soft Dependencies**: Many relationships are optional to support various business models
- **Version Control**: Use optimistic locking for entities synced with external calendars
- **Role-Based Access**: Implement proper role checking for all protected operations
