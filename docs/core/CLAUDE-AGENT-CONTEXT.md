# MedBookings Codebase Context

**Last Updated**: 2025-11-05
**Purpose**: Cached codebase knowledge for Claude Code (reduces analysis from ~72k to ~15k tokens)
**Status**: ✅ Current (refreshed via full scan)

---

## 1. Project Overview

### Tech Stack (Production)
```json
{
  "framework": "Next.js 14.2.15 (App Router)",
  "api": "tRPC 11.4.3",
  "database": "PostgreSQL + Prisma 5.22.0",
  "auth": "NextAuth.js 4.24.10",
  "ui": "Radix UI + Tailwind CSS + shadcn/ui",
  "state": "TanStack Query 5.60.6 (via tRPC)",
  "validation": "Zod 3.25.48",
  "testing": "Playwright 1.54.1 (e2e only)",
  "deployment": "Vercel",
  "monitoring": "Vercel Analytics + Speed Insights"
}
```

### Key Dependencies
- **Communication**: SendGrid (@sendgrid/mail), Twilio, Nodemailer
- **Calendar**: Google APIs (googleapis 148.0.0), date-fns 3.6.0, date-fns-tz 3.2.0
- **Storage**: Vercel Blob (@vercel/blob 2.0.0)
- **Rate Limiting**: Upstash Redis (@upstash/ratelimit 2.0.6)
- **Maps**: @react-google-maps/api 2.20.7
- **Security**: bcryptjs 3.0.2 (password hashing)

### Business Domain
**Healthcare appointment management platform for South Africa**
- POPIA-compliant (South African data protection)
- Timezone: Africa/Johannesburg (UTC+2, no DST)
- Multi-tenant: Providers + Organizations + Clients
- Billing: Slot-based subscriptions with tiered overage pricing

---

## 2. Database Schema (Prisma)

### Core Entities

#### User (Authentication & Profile)
```prisma
model User {
  id: String @id @default(cuid())
  email: String? @unique
  emailVerified: DateTime?
  role: UserRole @default(USER)  // USER | ADMIN | SUPER_ADMIN
  password: String?  // bcrypt hashed
  passwordMigratedAt: DateTime?  // SHA-256 → bcrypt migration tracking
  passwordMigrationDeadline: DateTime?  // 90 days from creation
  accountLockedUntil: DateTime?  // Rate limiting lockouts
  
  // Relations: provider, bookings, organizations, reviews, etc.
}
```

#### Provider
```prisma
model Provider {
  id: String @id
  userId: String @unique
  name: String
  status: ProviderStatus @default(PENDING_APPROVAL)
  // PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE | REJECTED
  approvedById: String?
  approvedAt: DateTime?
  rejectionReason: String?
  
  trialStarted: DateTime?
  trialEnded: DateTime?
  trialStatus: TrialStatus?
  
  // Relations: availabilities, services, subscriptions, typeAssignments
}
```

#### Organization
```prisma
model Organization {
  id: String @id
  name: String
  status: OrganizationStatus @default(PENDING_APPROVAL)
  billingModel: OrganizationBillingModel @default(CONSOLIDATED)
  // CONSOLIDATED | PER_LOCATION
  
  // Relations: locations, memberships, providerConnections
}
```

#### Availability & Booking Flow
```prisma
Availability {
  providerId: String
  organizationId: String?  // If organization-created
  status: AvailabilityStatus  // PENDING | ACCEPTED | REJECTED
  startTime/endTime: DateTime  // UTC storage
  isRecurring: Boolean
  recurrencePattern: Json?  // { frequency, interval, daysOfWeek, until }
  
  // → generates CalculatedAvailabilitySlot[]
}

CalculatedAvailabilitySlot {
  availabilityId: String
  serviceId: String
  status: SlotStatus  // AVAILABLE | BOOKED | BLOCKED | INVALID
  blockedByEventId: String?  // Google Calendar event blocking slot
  
  // → booking: Booking? (one-to-one)
}

Booking {
  slotId: String? @unique
  status: BookingStatus  // PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
  isGuestBooking: Boolean
  guestName/guestEmail/guestPhone: String?  // For non-registered users
  price: Decimal
  isOnline: Boolean
  meetLink: String?  // Auto-generated Google Meet link
}
```

#### Calendar Integration
```prisma
CalendarIntegration {
  providerId: String @unique
  calendarProvider: String  // "GOOGLE"
  accessToken/refreshToken: String
  syncDirection: CalendarSyncDirection  // BIDIRECTIONAL | IMPORT_ONLY | EXPORT_ONLY
  autoCreateMeetLinks: Boolean
  syncIntervalMinutes: Int @default(15)
  
  // Webhook support for real-time sync
  webhookChannelId: String?
  webhookExpiresAt: DateTime?
}

CalendarEvent {
  externalEventId: String  // Google Calendar event ID
  blocksAvailability: Boolean
  syncStatus: CalendarEventSyncStatus
  
  // → blockedSlots: CalculatedAvailabilitySlot[]
}
```

#### Subscription & Billing
```prisma
Subscription {
  organizationId: String? OR providerId: String?
  type: SubscriptionType  // BASE | WEBSITE_HOSTING | REVIEW_PROMOTION
  status: SubscriptionStatus  // ACTIVE | TRIALING | PAST_DUE | CANCELLED
  planId: String
  
  currentMonthSlots: Int  // Usage tracking
  billingCycleStart/End: DateTime
  
  // → billedSlots: CalculatedAvailabilitySlot[]
}

SubscriptionPlan {
  basePrice: Decimal  // e.g., R300
  includedSlots: Int @default(30)
  tierPricing: Json  // { "31-50": 5, "51-100": 4, "101+": 3 }
}
```

### Key Enums (Import from @prisma/client)
```typescript
// Import pattern: import { UserRole, ProviderStatus } from '@prisma/client';

UserRole: USER | ADMIN | SUPER_ADMIN
ProviderStatus: PENDING_APPROVAL | REJECTED | APPROVED | TRIAL | TRIAL_EXPIRED | ACTIVE | PAYMENT_OVERDUE | SUSPENDED | CANCELLED
OrganizationStatus: (same as ProviderStatus)
AvailabilityStatus: PENDING | ACCEPTED | REJECTED
SlotStatus: AVAILABLE | BOOKED | BLOCKED | INVALID
BookingStatus: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
SchedulingRule: CONTINUOUS | ON_THE_HOUR | ON_THE_HALF_HOUR
Languages: English | IsiZulu | IsiXhosa | Afrikaans | ... (11 SA languages)
```

### Indexes (Performance-Critical)
```prisma
@@index([providerId, startTime, endTime])  // Availability lookups
@@index([startTime, status, serviceId])    // Slot searches
@@index([status])                          // Admin filtering
@@index([userId, createdAt])               // Audit trails
```

---

## 3. API Architecture (tRPC)

### Router Structure (`src/server/api/root.ts`)
```typescript
export const appRouter = createTRPCRouter({
  admin: adminRouter,           // 1084 lines - provider/org approval, analytics
  auth: authRouter,             //  383 lines - login, registration, verification
  billing: billingRouter,       //  253 lines - subscriptions, payments, usage
  calendar: calendarRouter,     // 2555 lines - availability, bookings, slots
  communications: communicationsRouter,  //   22 lines - email/SMS endpoints
  debug: debugRouter,           //   20 lines - development utilities
  organizations: organizationsRouter,    // 1714 lines - org management, invitations
  profile: profileRouter,       //  195 lines - user profile CRUD
  providers: providersRouter,   // 3132 lines - provider onboarding, services
  settings: settingsRouter,     //  371 lines - user preferences
});
```

### Procedure Types (`src/server/trpc.ts`)
```typescript
publicProcedure        // No auth required
protectedProcedure     // Requires authentication (ctx.session.user guaranteed)
adminProcedure         // Requires ADMIN or SUPER_ADMIN role
superAdminProcedure    // Requires SUPER_ADMIN role
rateLimitedProcedure   // 100 req/min (Upstash Redis)
authRateLimitedProcedure  // 5 req/15min (brute force protection)
```

### Middleware & Context
```typescript
// src/server/trpc.ts:44-58
createTRPCContext: {
  session: Session | null,
  prisma: PrismaClient,
  req: Request,
  requestId: string  // UUID for tracing
}

// Rate limiting uses Upstash Redis (production-required)
// IP extraction: x-forwarded-for, x-real-ip, cf-connecting-ip
```

### Type Extraction Pattern (REQUIRED)
```typescript
// ✅ CORRECT - Extract types from tRPC router outputs
import { type RouterOutputs } from '@/utils/api';

type AdminProvider = RouterOutputs['admin']['getProviderById'];
type ProviderList = RouterOutputs['admin']['getProviders'];
type SingleProvider = ProviderList[number];

// ❌ FORBIDDEN - Never export types from hooks
export function useAdminProvider(id: string) {
  return api.admin.getProviderById.useQuery({ id });
}
```

---

## 4. Feature Architecture

### Feature Directory Structure
```
src/features/
├── admin/          # Admin dashboard, approval workflows
├── auth/           # Login, registration, email verification
├── billing/        # Subscriptions, payments, usage tracking
├── calendar/       # Availability, bookings, slots, Google Calendar sync
├── communications/ # Email/SMS/WhatsApp templates
├── invitations/    # Organization member invitations
├── organizations/  # Org management, locations, provider networks
├── profile/        # User profile management
├── providers/      # Provider onboarding, services, requirements
├── reviews/        # Review system (future)
└── settings/       # User preferences
```

### Feature Pattern (Example: `features/calendar/`)
```
calendar/
├── components/
│   ├── availability/           # Availability CRUD forms
│   ├── error-boundary/         # Error handling
│   ├── loading/                # Skeleton states
│   ├── provider-calendar-slot-view.tsx
│   ├── user-bookings-page.tsx
│   └── ...
├── hooks/
│   └── (NO HOOKS - tRPC queries used directly in components)
├── lib/
│   ├── actions.ts              # Server actions (business logic)
│   ├── slot-generation.ts      # Slot calculation algorithms
│   ├── recurrence-utils.ts     # Recurring availability
│   ├── scheduling-rules.ts     # ON_THE_HOUR, etc.
│   └── ...
└── types/
    ├── types.ts                # Domain types (RecurrencePattern, etc.)
    ├── schemas.ts              # Zod schemas for tRPC input
    └── guards.ts               # Runtime type guards
```

### Key Features by Size
1. **Calendar** (2555 LOC router) - Core booking flow, availability management, slot generation
2. **Providers** (3132 LOC router) - Onboarding, service configuration, requirement validation
3. **Organizations** (1714 LOC router) - Multi-location management, provider networks, invitations
4. **Admin** (1084 LOC router) - Approval workflows, analytics, system management

---

## 5. Critical Utilities

### Timezone (`src/lib/timezone.ts`)
```typescript
// ⚠️ CRITICAL: All dates stored in UTC, displayed in SAST (UTC+2)
// ❌ NEVER: new Date(), Date.now()
// ✅ ALWAYS: import from @/lib/timezone

nowUTC(): Date                    // Current time in UTC
nowSAST(): Date                   // Current time in SAST (for display)
toUTC(localDate: Date): Date      // Convert SAST → UTC (for storage)
fromUTC(utcDate: Date): Date      // Convert UTC → SAST (for display)
startOfDaySAST(date: Date): Date  // Get start of day in SAST, return UTC
endOfDaySAST(date: Date): Date    // Get end of day in SAST, return UTC
formatSAST(date: Date): string    // Format for display in en-ZA locale
addMilliseconds(date, ms): Date   // Token expiry, timeouts
parseUTC(isoString: string): Date // Parse ISO strings ensuring UTC
```

### Logger & PHI Protection (`src/lib/logger.ts`)
```typescript
// ⚠️ NO console.log/error/warn in production code (ESLint error)
// ✅ ALWAYS: Use logger with PHI sanitization

logger.debug('feature', 'message', context)  // Controlled by DEBUG_FEATURE=true
logger.info('message', context)              // Dev only
logger.warn('message', context)              // Always logged
logger.error('message', error, context)      // Always logged
logger.audit('message', context)             // POPIA compliance - always logged

// PHI Sanitization (REQUIRED before logging)
sanitizeEmail('john@example.com')   // → 'jo***@example.com'
sanitizePhone('+27821234567')       // → '+2782***4567'
sanitizeName('John Doe')            // → 'Jo** Do*'
sanitizeUserId(id)                  // → '[USER:cuid...]'
sanitizeContext(object)             // Auto-sanitizes known PHI fields
```

### Authentication (`src/lib/auth.ts`)
```typescript
// NextAuth configuration with:
// - Google OAuth (automatic email verification)
// - Credentials (email/password with bcrypt)
// - Session: JWT strategy, 30min timeout (POPIA requirement)
// - Auto-promotion: ADMIN_EMAILS env var → ADMIN role

getCurrentUser(): Promise<User | null>
checkRole(allowedRoles: UserRole[]): Promise<User>

// Password Migration: SHA-256 → bcrypt
// - Auto-migrates on successful login (90-day grace period)
// - After deadline: forces password reset
```

### Middleware (`src/middleware.ts`)
```typescript
// Route protection with:
// - Session timeout enforcement (30min inactivity - POPIA)
// - Email verification checks (VERIFIED_USER requirement)
// - Organization membership validation (database queries)
// - Audit logging for authorization failures

// Protected routes:
// - /admin/* → ADMIN | SUPER_ADMIN
// - /organizations/* → VERIFIED_USER + active membership
// - /providers/*, /calendar/*, /availability/*, /bookings/* → VERIFIED_USER
// - /profile, /dashboard, /settings → Any authenticated user
```

### Rate Limiting (`src/lib/rate-limit.ts`)
```typescript
// ⚠️ CRITICAL: Requires Upstash Redis in production
// Distributed rate limiting across Vercel serverless instances

apiRateLimit: 100 requests per 60 seconds      // General API protection
authRateLimit: 5 requests per 15 minutes       // Brute force prevention (login, etc.)
```

---

## 6. Compliance & Security

### Pre-Commit Hook (`.husky/pre-commit`)
```bash
# Enforcement order:
1. Architecture impact check (warnings only)
2. CLAUDE.md auto-sync (if modified)
3. File-by-file CLAUDE.md compliance validation
4. ESLint (max-warnings=150, errors block)
5. TypeScript type check (npx tsc --noEmit)
6. Personal workflow file prevention

# Bypass: git commit --no-verify (use with caution)
```

### ESLint Rules (`.eslintrc.js`)
```javascript
// Security & PHI Protection
'no-console': 'error'  // Prevent PHI leakage (except logger.ts, tests, scripts)

// Type Safety
'@typescript-eslint/no-explicit-any': 'warn'  // 245+ violations, migrating to 'error'
'@typescript-eslint/no-unsafe-assignment': 'warn'

// CLAUDE.md Compliance (Custom Rules)
'rulesdir/no-new-date': 'error'  // Enforce timezone utilities
'rulesdir/no-type-barrel-exports': 'error'
'rulesdir/enforce-direct-type-imports': 'error'
'rulesdir/enforce-type-file-structure': 'warn'
'rulesdir/enforce-type-file-naming': 'warn'
'rulesdir/enforce-prisma-derived-patterns': 'warn'

// Exceptions (with documented reasons):
// - Type guards: allow (value as any) for runtime validation
// - tRPC routers: complex Prisma includes create unavoidable any types
// - Form components: react-hook-form generic types
// - Google Maps: external library with complex types
```

### Compliance Validators (`scripts/commit-gate/`)
```javascript
compliance-validator.js    // 13 rules (timezone, type safety, PHI, architecture, etc.)
transaction-validator.js   // Validates prisma.$transaction() for multi-table ops
phi-validator.js          // Ensures logger.* calls use sanitization
```

### POPIA Compliance
- **Session Timeout**: 30 minutes (enforced in middleware)
- **Audit Trail**: All PHI access logged via `logger.audit()`
- **Consent Tracking**: User.emailVerified, User.phoneVerified
- **Data Minimization**: PHI sanitization before logging
- **Access Control**: Role-based + email verification requirements

### Recent Security Work (Last 5 Commits)
```
ee7b0ea - Transaction safety: 20 additional suppressions (documented)
31d212f - Fix: resendProviderInvitation race condition (admin suppressions)
d205889 - Transaction safety: auth, admin, profile routers
bc5cdb5 - Transaction safety: organization operations
390d491 - Transaction safety: provider requirement workflows
```

---

## 7. UI Architecture

### Component Library (`src/components/`)
```
components/
├── ui/                  # shadcn/ui components (Radix UI + Tailwind)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── calendar.tsx
│   ├── location-autocomplete.tsx  # Google Maps integration
│   └── ... (30+ components)
├── auth/                # Shared auth components
├── layout/              # Navigation, sidebars
├── providers/           # React Query + tRPC provider wrapper
└── skeletons/           # Loading states
```

### App Routes (`src/app/`)
```
app/
├── (general)/           # Public routes
│   ├── page.tsx         # Landing page
│   ├── login/
│   ├── providers/       # Public provider search
│   ├── verify-email/
│   └── ...
└── (dashboard)/         # Protected routes (middleware-enforced)
    ├── admin/
    ├── organizations/
    ├── providers/
    ├── calendar/
    └── ...
```

### Client vs Server Components
- **Default**: Server Components (Next.js 14 App Router)
- **Client**: Marked with `'use client'` - forms, interactivity, tRPC hooks
- **Data Fetching**: tRPC hooks (`api.router.procedure.useQuery()`)
- **Form Handling**: react-hook-form + zodResolver

---

## 8. Data Flow Patterns

### Booking Flow (Critical Path)
```typescript
1. User selects slot → client validates availability
2. createBooking mutation (calendar router)
   ├─ Transaction start
   ├─ Lock slot (findUnique + status check)
   ├─ Validate no double-booking (CRITICAL)
   ├─ Create booking
   ├─ Update slot status → BOOKED
   ├─ Generate Google Meet link (if online)
   ├─ Transaction commit
   └─ Revalidate cache
3. Send notifications (email/SMS/WhatsApp)
4. Audit log booking creation (POPIA)
```

### Availability Creation → Slot Generation
```typescript
1. Provider creates availability (calendarRouter.createAvailability)
2. validateAvailabilityCreation() - business rules
3. generateRecurringInstances() - if recurring
4. generateSlotDataForAvailability()
   ├─ Apply schedulingRule (CONTINUOUS, ON_THE_HOUR, etc.)
   ├─ Split by service durations
   ├─ Check calendar event conflicts (CalendarIntegration)
   └─ Generate CalculatedAvailabilitySlot[] records
5. Transaction: Insert availability + all slots atomically
```

### Type Safety Chain
```
Database (Prisma types)
  ↓
Zod Schemas (tRPC input/output validation)
  ↓
tRPC Procedures (inferred types)
  ↓
RouterOutputs (type extraction)
  ↓
Component Props (type-safe all the way)
```

---

## 9. Known Issues & TODOs

### High Priority (4 items)
1. **Organization Logo Upload** - Vercel Blob integration needed (~2h)
   - Files: `features/organizations/components/*/edit-organization-basic-info.tsx`
   
2. **Calendar Import/Export** - iCal format support (~4-6h)
   - Files: `app/(dashboard)/calendar/availability/page.tsx:173,184`

3. **Organization Calendar View** - Multi-provider calendar (~3-4h)
   - Files: `app/(dashboard)/organizations/[id]/manage-calendar/page.tsx:197`

4. **Error Monitoring** - Sentry integration (~1-2h)
   - Files: `app/(general)/(auth)/error/page.tsx:73`

### Low Priority (13 email notifications)
- SendGrid templates needed
- See: `docs/core/TODO-TRACKING.md` for complete list

### Type Safety Status ✅
- **0 ESLint warnings** (100% compliance achieved Nov 3, 2025)
- All legitimate 'any' usage covered by documented overrides (.eslintrc.js:166-246)
- `@typescript-eslint/no-explicit-any` set to 'warn' to prevent future violations
- Historical migration: 245+ warnings → 0 warnings (Oct-Nov 2025)

---

## 10. Development Workflow

### Commands
```bash
# Development
npm run dev                  # Start dev server (DO NOT RUN via Claude Code)
npm run build                # Build + type check (ALWAYS run before commit)
npm run lint                 # ESLint + auto-fix (ALWAYS run before commit)

# Testing
npm run test                 # Playwright e2e tests (user runs)
npm run test:auth            # Auth flow tests
npm run test:booking         # Booking flow tests

# Compliance
npm run compliance:check     # Check CLAUDE.md sync status
npm run compliance:sync      # Force sync compliance rules
npm run compliance:validate  # Validate specific file

# Database
npx prisma generate          # Generate Prisma client
npx prisma studio            # DB GUI
npx prisma db push           # Push schema (dev only)
```

### File Naming Conventions (ESLint-enforced)
- Files: `kebab-case.tsx` (e.g., `user-bookings-page.tsx`)
- Folders: `kebab-case` (e.g., `src/features/calendar/`)
- Types: `types.ts`, `schemas.ts`, `guards.ts`, `enums.ts` (enforced structure)

### Build Verification (Mandatory)
```bash
# ALWAYS run before marking tasks complete:
npx tsc --noEmit && npm run build && npm run lint

# If any fail: Fix errors systematically, never proceed with failures
```

---

## 11. Recent Changes Log

### 2025-11-05 (Transaction Safety Sprint)
- **Commits**: ee7b0ea, 31d212f, d205889, bc5cdb5, 390d491
- **Changes**: 
  - Added transaction safety for all multi-table operations
  - Fixed critical race condition in `resendProviderInvitation`
  - Documented 26 transaction safety suppressions
  - Auth router: Wrapped email verification in transactions
  - Provider router: Requirement validation workflows now atomic

### 2025-11-03 (Infrastructure Improvements)
- **Commit**: 3bd520b
- Comprehensive infrastructure improvements and compliance fixes

### 2025-11-02 (Documentation & Security)
- **Commits**: acbddd0, b92237c, da1216e, 2dbd1da
- Documentation validation warnings resolved
- Environment variable configuration standardized
- Redundant .env file removed

### 2025-11-01 (Compliance Audit)
- **Commits**: db7c296, be6c3a2
- Security audit completed - all tests passed
- CLAUDE.md compliance violations resolved

---

## 12. Integration Points

### Google Calendar Integration
```typescript
// CalendarIntegration model stores OAuth tokens
// Sync operations tracked in CalendarSyncOperation
// External events → CalendarEvent → block CalculatedAvailabilitySlot[]

Sync Types:
- FULL_SYNC: Complete calendar refresh
- INCREMENTAL_SYNC: Changes since lastSyncToken
- WEBHOOK_SYNC: Real-time push notifications
- MANUAL_SYNC: User-triggered
```

### Google Meet Integration
```typescript
// Auto-generation when isOnline = true
// Stored in Booking.meetLink
// MeetSession model tracks status: SCHEDULED | STARTED | ENDED | CANCELLED
```

### Email/SMS/WhatsApp
```typescript
// SendGrid: Transactional emails (SENDGRID_API_KEY)
// Twilio: SMS + WhatsApp (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
// Templates: src/features/communications/lib/email-templates.ts

Communication Preferences:
- User.reminderChannels: string[] @default(["email", "sms"])
- CommunicationPreference model: per-user channel settings
```

### File Storage
```typescript
// Vercel Blob Storage (@vercel/blob)
// Currently used for: Provider profile images
// Planned: Organization logos, requirement documents
// Utility: src/lib/storage/blob.ts
```

---

## 13. Performance Optimizations

### Database
- **Pagination**: ALL `findMany()` MUST include `take:` (min 20)
- **Indexes**: Strategic indexes on high-traffic queries (see Schema section)
- **N+1 Prevention**: Eager loading with `include:` and `select:`
- **Transactions**: Multi-table operations wrapped in `prisma.$transaction()`

### Frontend
- **Code Splitting**: Route-based (Next.js automatic)
- **Image Optimization**: Next.js Image component (REQUIRED)
- **Caching**: React Query (via tRPC) - 5min default staleTime
- **Lazy Loading**: Dynamic imports for heavy components

### API
- **Rate Limiting**: Upstash Redis (production-required)
- **Response Caching**: React Query on client
- **Debouncing**: Search inputs (500ms default)
- **Optimistic Updates**: Booking creation, availability acceptance

---

## 14. Environment Variables

### Required (Production)
```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://medbookings.co.za"
NEXTAUTH_SECRET="<32+ char random string>"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Rate Limiting (CRITICAL)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="noreply@medbookings.co.za"

# SMS/WhatsApp
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# Storage
BLOB_READ_WRITE_TOKEN="..."

# Admin
ADMIN_EMAILS="admin@medbookings.co.za"
```

### Optional
```bash
# Development Debugging
DEBUG_ALL=true           # Enable all debug logs
DEBUG_FORMS=true         # Form validation
DEBUG_CALENDAR=true      # Calendar operations
DEBUG_BOOKINGS=true      # Booking flow
```

---

## 15. Key Architectural Decisions

### Why tRPC?
- **Type Safety**: End-to-end TypeScript without code generation
- **DX**: Auto-completion, refactoring safety
- **Performance**: No REST serialization overhead
- **Integration**: Native React Query support

### Why Prisma?
- **Type Generation**: Database schema → TypeScript types
- **Migrations**: Version-controlled schema changes
- **Type Safety**: Compile-time query validation
- **JSON Support**: Flexible fields (tierPricing, recurrencePattern)

### Why Feature Folders?
- **Isolation**: No cross-feature imports (ESLint enforced)
- **Cohesion**: Related code grouped together
- **Scalability**: Easy to extract to microservices if needed

### Why Timezone Utilities?
- **Consistency**: Single source of truth for date handling
- **POPIA**: Accurate timestamps for audit trails
- **UX**: Correct display in South African timezone (UTC+2)
- **Safety**: Prevents `new Date()` bugs (ESLint enforced)

### Why Compliance System?
- **Automation**: Catches violations before they reach production
- **Documentation**: CLAUDE.md as enforceable spec
- **Quality**: 85% automation coverage (see ENFORCEMENT-COVERAGE.md)
- **POPIA**: Built-in data protection compliance

---

## 16. Quick Reference

### Need to...

**Add a new tRPC endpoint?**
1. Add procedure to `src/server/api/routers/{feature}.ts`
2. Use Zod schema for input validation
3. Wrap multi-table ops in `prisma.$transaction()`
4. Add to router in `src/server/api/root.ts` if new router
5. Extract types: `RouterOutputs['router']['procedure']`

**Create a new feature?**
1. Create `src/features/{feature}/` directory
2. Add `components/`, `lib/`, `types/` subdirectories
3. Create tRPC router in `src/server/api/routers/{feature}.ts`
4. Follow isolation rules (no cross-feature imports)

**Add a database field?**
1. Update `prisma/schema.prisma`
2. Run `npx prisma generate` (DO NOT run migrate in dev)
3. Update related Zod schemas in `features/*/types/schemas.ts`
4. Update tRPC procedures that query the model

**Handle dates/times?**
1. ALWAYS import from `@/lib/timezone`
2. Store in UTC: `nowUTC()`, `parseUTC()`
3. Display in SAST: `formatSAST()`, `fromUTC()`
4. Query ranges: `startOfDaySAST()`, `endOfDaySAST()`

**Log something?**
1. NEVER use `console.log/error/warn`
2. Use `logger.info/warn/error/audit()`
3. Sanitize PHI: `sanitizeEmail()`, `sanitizeName()`, etc.
4. Use feature-specific debug: `logger.debug('feature', ...)`

**Fix type error?**
1. Check `RouterOutputs` extraction pattern
2. Verify Prisma schema matches code
3. Run `npx prisma generate`
4. Check `.eslintrc.js` overrides for acceptable `any` usage

---

## 17. Contact & Resources

### Documentation
- **Full Specs**: `/docs/INDEX.md` - Complete documentation index
- **CLAUDE.md**: `/CLAUDE.md` - Comprehensive development guidelines
- **Type Safety**: `/docs/compliance/TYPE-SAFETY.md`
- **Database Ops**: `/docs/core/DATABASE-OPERATIONS.md`
- **Timezone Guide**: `/docs/compliance/TIMEZONE-GUIDELINES.md`
- **Logging Guide**: `/docs/compliance/LOGGING.md`

### External Resources
- Next.js Docs: https://nextjs.org/docs
- tRPC Docs: https://trpc.io/docs
- Prisma Docs: https://www.prisma.io/docs
- Radix UI: https://www.radix-ui.com/primitives/docs/overview/introduction
- Tailwind CSS: https://tailwindcss.com/docs

---

**Cache Usage Instructions**:
1. Read this file at start of comprehensive analysis tasks
2. Only read additional files on-demand as needed
3. Refresh cache (full scan) if file >2 weeks old or on explicit user request
4. Update "Recent Changes Log" after major work sessions
5. Update "Last Updated" timestamp when refreshing

**Token Savings**: ~79% (15k vs 72k tokens for full scan)
