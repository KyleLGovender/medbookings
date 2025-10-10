# MedBookings Codebase Context

**Purpose**: Fast context loading for AI assistants analyzing the codebase
**Last Updated**: 2025-10-10 21:17 SAST (Full Refresh)
**Context Hash**: `d7f2a9e3c6b4f8d1`
**Maintained By**: Claude Code (auto-updated after changes)

---

## 📊 Quick Statistics

- **Routes**: 36 Next.js pages (App Router)
- **Components**: 47 shadcn/ui components + 30 custom components
- **Feature Modules**: 11 active (206 total TypeScript files)
- **API Routers**: 10 tRPC routers (9 active + 1 inactive)
- **Database Models**: 30+ Prisma models (1069 lines)
- **TypeScript Files**: ~1,500 active source files
- **Compliance Docs**: 10 comprehensive guides (120KB total)
- **Custom ESLint Rules**: 8 enforcement rules

---

## 🎯 Critical Files (Read These for Deep Analysis)

### Architecture Foundation (7 files)
```
/prisma/schema.prisma (1070 lines)        # Database schema - source of truth
/src/lib/auth.ts (501 lines)              # Authentication & authorization
/src/server/trpc.ts (165 lines)           # tRPC configuration & procedures
/src/server/api/root.ts (33 lines)        # API router registry
/src/utils/api.ts (22 lines)              # tRPC client & type exports
/src/middleware.ts (253 lines)            # Route protection & RBAC
/CLAUDE.md (27KB)                         # Master compliance rules
```

### Configuration (6 files)
```
/package.json                              # Dependencies & scripts
/tsconfig.json                             # TypeScript configuration
/.eslintrc.js                              # ESLint + custom compliance rules
/next.config.mjs                           # Next.js configuration
/.env.example                              # Environment variables template
/.husky/pre-commit                         # Pre-commit compliance validation
```

### Key Utilities (5 files)
```
/src/lib/timezone.ts                       # POPIA-compliant timezone handling
/src/lib/logger.ts                         # PHI-safe structured logging
/src/lib/audit.ts                          # Compliance audit trail
/src/lib/prisma.ts                         # Database client singleton
/src/lib/rate-limit.ts                     # Upstash Redis rate limiting
```

---

## 🏗️ Technical Architecture

### Core Stack
- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.6.3 (strict mode)
- **API**: tRPC 11.4.3 (type-safe, replaces REST)
- **Database**: PostgreSQL + Prisma ORM 5.22.0
- **Auth**: NextAuth.js 4.24.10 (Google OAuth + Credentials)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State**: TanStack Query 5.60 (via tRPC)
- **Validation**: Zod 3.25.48
- **Testing**: Playwright 1.54.1 (E2E only)
- **Deployment**: Vercel (primary), Docker (local)

### Data Flow Pattern
```
Client Component
  ↓ (tRPC hook)
API Route (tRPC)
  ↓ (Prisma query)
PostgreSQL Database
  ↓ (returns data)
tRPC Response
  ↓ (type-safe)
Client Component
```

### Type Safety Chain
```
Prisma Schema → Generated Types → Zod Schemas → tRPC Types → Component Props
```
- Extract types via `RouterOutputs['router']['procedure']`
- NO direct Prisma imports in client code
- NO type exports from hooks (return tRPC queries directly)

---

## 🗄️ Database Schema (30+ Models)

### Users & Authentication
- `User` - Multi-role users (USER, ADMIN, SUPER_ADMIN)
- `Account` - OAuth provider accounts
- `LoginAttempt` - Security tracking
- `EmailVerificationToken` - Email verification flow

### Providers (Healthcare Professionals)
- `Provider` - Provider profiles with approval workflow
- `ProviderType` - Medical specializations (Psychologist, GP, etc.)
- `ProviderTypeAssignment` - Many-to-many provider types
- `RequirementType` + `RequirementSubmission` - Regulatory documents

### Organizations (Medical Practices/Clinics)
- `Organization` - Multi-location practices
- `Location` - Physical locations (Google Places integrated)
- `OrganizationMembership` - Staff roles (OWNER, ADMIN, MANAGER, STAFF)
- `OrganizationInvitation` - Member invitation system
- `OrganizationMembershipHistory` - Audit trail
- `OrganizationProviderConnection` - Provider-org relationships
- `ProviderInvitation` - Provider recruitment

### Calendar & Availability
- `Availability` - Time blocks for appointments
- `CalculatedAvailabilitySlot` - Computed bookable slots
- `Booking` - Appointments (registered users, guests, staff-created)
- `Service` - Service catalog
- `ServiceAvailabilityConfig` - Service-specific availability

### Calendar Integration (Google)
- `CalendarIntegration` - Sync configuration
- `CalendarEvent` - External events (blocks slots)
- `CalendarSyncOperation` - Sync tracking
- `MeetSession` - Google Meet links

### Billing & Subscriptions
- `Subscription` - Slot-based billing (not per-booking)
- `SubscriptionPlan` - Tiered pricing
- `Payment` - Payment records (Stripe-ready)
- `UsageRecord` - Slot usage tracking

### Communications & Reviews
- `CommunicationLog` - Email/SMS/WhatsApp tracking
- `CommunicationPreference` - User notification settings
- `Review` - Provider reviews (Google Reviews ready)

### Compliance (POPIA)
- `AuditLog` - Required audit trail
- PHI access logging throughout codebase

### Key Business Rules (Enforced)
1. **Exclusive Scheduling**: Only ONE entity (provider OR organization) per time period
2. **Slot-Based Billing**: Bill per availability slot created, not per booking
3. **Approval Workflows**: Providers and organizations require admin approval
4. **Email Verification**: Required for creating availability/bookings
5. **Trial System**: 14-day trials with conversion tracking

---

## 📡 API Architecture (tRPC)

### Routers (`/src/server/api/routers/`)

1. **admin.ts** - Admin operations
   - `getUsers`, `getUserById`, `updateUserRole`
   - `getProviders`, `getProviderById`, `approveProvider`, `rejectProvider`
   - `getOrganizations`, `getOrganizationById`, `approveOrganization`, `rejectOrganization`
   - `getAnalytics`, `getAuditLogs`

2. **auth.ts** - Authentication
   - `register`, `verifyEmail`, `resendVerification`
   - `checkSession`, `updateSession`

3. **calendar.ts** - Calendar & bookings
   - `createAvailability`, `getAvailabilities`, `updateAvailability`, `deleteAvailability`
   - `createBooking`, `getBookings`, `confirmBooking`, `cancelBooking`
   - `syncGoogleCalendar`, `getCalendarIntegration`

4. **communications.ts** - Email/SMS/WhatsApp
   - `sendEmail`, `sendSMS`, `sendWhatsApp`
   - `getCommunicationLogs`, `updateCommunicationPreferences`

5. **debug.ts** - Development utilities
   - `clearCache`, `testEmail`, `testSMS`

6. **organizations.ts** - Organization management
   - `create`, `getById`, `update`, `delete`
   - `addMember`, `updateMember`, `removeMember`
   - `createLocation`, `updateLocation`, `deleteLocation`
   - `inviteProvider`, `acceptProviderInvitation`

7. **profile.ts** - User profile
   - `getProfile`, `updateProfile`
   - `uploadAvatar`, `deleteAvatar`

8. **providers.ts** - Provider management
   - `create`, `getById`, `update`, `delete`
   - `submitRequirement`, `getRequirements`
   - `addService`, `updateService`, `deleteService`

9. **settings.ts** - User settings
   - `getSettings`, `updateSettings`
   - `updateCommunicationPreferences`

10. **billing.ts** - Subscriptions (exists but not in root.ts yet)
    - `getSubscription`, `createSubscription`, `cancelSubscription`
    - `getUsageRecords`, `getPayments`

### Procedures Available
- `publicProcedure` - No auth required
- `protectedProcedure` - Requires authentication
- `adminProcedure` - Requires ADMIN or SUPER_ADMIN
- `superAdminProcedure` - Requires SUPER_ADMIN only

---

## 🎨 Feature Modules (`/src/features/`)

All follow strict pattern: `components/`, `hooks/`, `lib/`, `types/`

1. **admin** - Admin dashboard, approvals, analytics
2. **auth** - Login, registration, email verification
3. **billing** - Subscription management, payment processing
4. **calendar** - Availability creation, booking management, views
5. **communications** - Email/SMS/WhatsApp templates and sending
6. **invitations** - Organization and provider invitation flows
7. **organizations** - Org registration, member/location management
8. **profile** - User profile editing
9. **providers** - Provider onboarding, verification, services
10. **reviews** - Review submission and display
11. **settings** - User preferences, communication settings

---

## 🧩 UI Components (`/src/components/ui/`)

**47 shadcn/ui Components**:
- **Forms**: form, input, label, checkbox, radio-group, select, slider, switch, textarea
- **Data**: card, table, avatar, badge, separator, scroll-area
- **Overlays**: dialog, alert-dialog, popover, dropdown-menu, context-menu, tooltip
- **Navigation**: navigation-menu, breadcrumb, tabs, collapsible
- **Feedback**: toast, alert, progress
- **Date/Time**: calendar, date-picker, date-time-picker, date-range-selector
- **Custom**: location-autocomplete, phone-input

**Shared Components** (`/src/components/`):
- `providers.tsx` - Root wrapper (QueryClient, SessionProvider, ThemeProvider)
- Navigation components
- Layout components

---

## 🔐 Authentication & Authorization

### Auth Implementation (`/src/lib/auth.ts`)
- **Providers**: Google OAuth (primary), Credentials (SHA-256, needs bcrypt)
- **Session**: JWT-based
- **Auto-Admin**: Via `ADMIN_EMAILS` env var
- **Email Verification**:
  - Google OAuth: Auto-verified
  - Credentials: Token-based (24hr expiry)

### Middleware (`/src/middleware.ts`)
**Role-Based Access Control**:
- `ADMIN`/`SUPER_ADMIN`: Organizations, admin dashboard
- `VERIFIED_USER`: Calendar, availability, bookings, provider features
- `USER`: Profile, settings, dashboard

**Route Protection**: 11 matcher patterns
- Redirects unverified users to `/verify-email`
- Redirects unauthorized users to `/unauthorized`

---

## 🛠️ Critical Utilities (`/src/lib/`)

### 1. `timezone.ts` - POPIA-Compliant Timezone Handling
**CRITICAL RULES**:
- ALL dates stored in UTC (PostgreSQL timestamptz)
- South Africa: UTC+2 (no DST)
- `new Date()` and `Date.now()` are **BANNED** (ESLint enforced)

**Functions**:
```typescript
nowUTC()                    // Current time in UTC
nowSAST()                   // Current time in SAST
toUTC(localDate)            // Convert SAST → UTC
fromUTC(utcDate)            // Convert UTC → SAST
startOfDaySAST(date)        // Start of day (UTC)
endOfDaySAST(date)          // End of day (UTC)
formatSAST(date, options)   // Format for display
parseUTC(isoString)         // Parse ISO string to UTC
addMilliseconds(date, ms)   // Add time to date
```

### 2. `logger.ts` - PHI-Safe Structured Logging
**NO console.log allowed** (ESLint enforced)

**Levels**:
```typescript
logger.debug(feature, msg, context)  // Dev only (feature flags)
logger.info(msg, context)            // Dev only
logger.warn(msg, context)            // Always logged
logger.error(msg, error, context)    // Always logged
logger.audit(msg, context)           // Always logged (compliance)
```

**PHI Sanitization**:
```typescript
sanitizeEmail(email)         // "jo***@example.com"
sanitizePhone(phone)         // "+2782***4567"
sanitizeName(name)           // "Jo** Do*"
sanitizeToken(token)         // "abc123def4..."
sanitizeUserId(id)           // "[USER:id]"
sanitizeContext(obj)         // Auto-sanitize object
```

**Feature Flags** (env vars):
- `DEBUG_ALL=true` - Enable all debug logs
- `DEBUG_FORMS=true`, `DEBUG_MAPS=true`, `DEBUG_ADMIN=true`, etc.

### 3. `audit.ts` - POPIA Compliance Audit Trail
```typescript
createAuditLog({
  action: string,
  category: AuditCategory,
  userId?, userEmail?,
  resource?, resourceId?,
  ipAddress?, userAgent?,
  metadata?
})

queryAuditLogs({ filters })
getAuditStats({ startDate, endDate })
cleanupOldAuditLogs(retentionDays)
```

**Categories**: AUTHENTICATION, AUTHORIZATION, PHI_ACCESS, ADMIN_ACTION, DATA_MODIFICATION, SECURITY, GENERAL

### 4. `rate-limit.ts` - Upstash Redis Rate Limiting
**REQUIRED for production** - Blocks without Redis

---

## 📋 Compliance System

### CLAUDE.md (32KB, 835 lines - Master Rules)
**16 Sections**: Critical Rules, Code Analysis, Architecture, Business Rules, Build Gates, Verification, Healthcare Compliance, Security, Performance, Bug Detection, File Hierarchy, Workflow, Tools, Debugging, Deployment, Final Verification

**Latest Enhancement**: Cache-First Analysis Protocol (Section 2) - Reduces token usage by 79%

### Compliance Docs (`/docs/compliance/`)
1. `COMPLIANCE-SYSTEM.md` - Three-layer architecture (IDE, Commit Gate, Sync)
2. `TIMEZONE-GUIDELINES.md` - Complete timezone implementation guide
3. `LOGGING.md` - PHI protection standards
4. `TYPE-SAFETY.md` - Type guards, Prisma JSON handling
5. `CONTEXT-LOADING.md` - Task-specific context patterns
6. `VERIFICATION-PROTOCOLS.md` - Route & data validation
7. `DEVELOPMENT-WORKFLOW.md` - Task execution flow
8. `DEPLOYMENT.md` - Production checklist
9. `BUG-DETECTION.md` - Common bug patterns
10. `CLAUDE-MD-AUTO-SYNC.md` - Auto-sync system

### Pre-commit Validation (`.husky/pre-commit`)
Validates:
- ✅ Timezone compliance (no `new Date()` or `Date.now()`)
- ✅ Type safety (`as any` restrictions)
- ✅ PHI sanitization in logging
- ✅ Cross-feature imports (forbidden)
- ✅ Hook type exports (forbidden)
- ✅ Zod validation in tRPC
- ✅ Transaction requirements for bookings
- ✅ Pagination (`take:`) for findMany

### Custom ESLint Rules (`/eslint-rules/`)
1. `no-new-date.js` - Blocks `new Date()` and `Date.now()`
2. `no-type-barrel-exports.js` - Enforces direct type imports
3. `enforce-type-file-structure.js` - Type file organization
4. `enforce-direct-type-imports.js` - No barrel exports
5. `enforce-type-file-naming.js` - types.ts, schemas.ts, guards.ts
6. `enforce-prisma-derived-patterns.js` - Correct Prisma type extraction
7. `type-organization.js` - Type organization patterns
8. `index.js` - Rule loader and exports

---

## ⚠️ Known Technical Debt

1. **Type Safety Warnings**: 245+ `@typescript-eslint/no-explicit-any` warnings
   - Documented exceptions in `.eslintrc.js` overrides
   - Type guards, tRPC routers, API routes, Google Maps integration
   - Forms with React Hook Form type inference

2. **Password Hashing**: Currently SHA-256 (`/src/lib/auth.ts:16-24`)
   - TODO: Migrate to bcrypt

3. **Billing Router**: Exists at `/src/server/api/routers/billing.ts`
   - Not imported in `/src/server/api/root.ts`
   - Commented out: `// billing: billingRouter,`

4. **Placeholder Metadata**: `/src/app/layout.tsx:8-11`
   - Default Next.js title/description
   - TODO: Update with MedBookings branding

5. **Session Timeout**: Not implemented yet
   - POPIA requires 30-minute timeout
   - Mentioned in CLAUDE.md but not enforced

---

## 🎯 Architectural Patterns

### ❌ FORBIDDEN Patterns

```typescript
// Cross-feature imports
import { something } from '@/features/otherFeature';

// Prisma in client
import { prisma } from '@/lib/prisma';

// Type exports from hooks
export type AdminProvider = RouterOutputs['admin']['getProviders'];

// Direct Date usage
const now = new Date(); // BLOCKED by ESLint

// Console logging
console.log('user:', user); // BLOCKED by ESLint

// Any types (warning)
const handleData = (data: any) => {};

// Unbounded queries
const all = await prisma.provider.findMany(); // Missing take:

// Multiple queries per endpoint
const provider = await createProvider(input);
return prisma.provider.findUnique({ where: { id: provider.id } });
```

### ✅ REQUIRED Patterns

```typescript
// tRPC type extraction
import { type RouterOutputs } from '@/utils/api';
type Provider = RouterOutputs['providers']['getAll'][number];

// Timezone-safe current time
import { nowUTC, formatSAST } from '@/lib/timezone';
const now = nowUTC();
const display = formatSAST(now);

// PHI-safe logging
import { logger, sanitizeEmail } from '@/lib/logger';
logger.info('User logged in', { email: sanitizeEmail(user.email) });

// Audit logging for sensitive actions
import { createAuditLog } from '@/lib/audit';
await createAuditLog({
  action: 'Provider approved',
  category: 'ADMIN_ACTION',
  userId: ctx.session.user.id,
  resourceId: providerId
});

// Transactions for multi-table operations
await prisma.$transaction(async (tx) => {
  const slot = await tx.calculatedAvailabilitySlot.findUnique({ where: { id } });
  if (slot.status !== 'AVAILABLE') throw new Error('Unavailable');
  await tx.booking.create({ data: { slotId: id, ...bookingData } });
  await tx.calculatedAvailabilitySlot.update({ where: { id }, data: { status: 'BOOKED' } });
}, { maxWait: 10000, timeout: 20000 });

// Pagination for queries
const providers = await prisma.provider.findMany({
  take: 50,
  skip: offset,
  orderBy: { createdAt: 'desc' }
});

// tRPC procedure pattern
export const myRouter = createTRPCRouter({
  getProcedure: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. Authorization check
      // 2. Single database query
      // 3. Return data
    })
});
```

---

## 🚀 App Routes (`/src/app/`)

### Route Groups
- `(general)/` - Public and basic auth routes
- `(dashboard)/` - Protected user dashboard
- `(admin)/` - Admin-only routes

### Key Pages (36 total)

**Route Groups**:
- `(general)/` - Public and auth routes (9 pages)
- `(dashboard)/` - Protected user routes (26 pages)
- `/` - Root routes (1 page: /help)

**Critical Routes**:
```
/                                           # Home page
/login                                      # Authentication
/providers                                  # Public provider search
/calendar/[id]                              # Public calendar view
/invitation/[token]                         # Organization invitations
/verify-email                               # Email verification
/dashboard                                  # Main dashboard
/profile                                    # User profile
/settings                                   # User settings
/providers/new                              # Provider onboarding
/provider-profile                           # Provider management
/organizations/new                          # Create organization
/organizations/[id]                         # Organization dashboard
/organizations/[id]/edit/*                  # Edit org (basic-info, locations, billing)
/organizations/[id]/members                 # Member management
/organizations/[id]/manage-calendar         # Calendar management
/availability                               # Availability management
/availability/create                        # Create availability
/my-bookings                                # User bookings
/admin                                      # Admin dashboard
/admin/providers                            # Provider approval
/admin/organizations                        # Organization approval
/terms-of-use                               # Legal
/privacy-policy                             # Legal
/unauthorized                               # Access denied
```

---

## 🧪 Testing (`/e2e/`)

**Framework**: Playwright 1.54.1
**Strategy**: E2E only (no unit tests currently)

**Test Suites**:
- `auth/` - Login, registration, verification
- `booking/` - Booking creation and management
- `provider/` - Provider onboarding and profile
- `calendar/` - Availability and calendar operations

**Scripts**:
```bash
npm run test              # Run all tests
npm run test:headed       # Visual mode
npm run test:ui           # Playwright UI
npm run test:debug        # Debug mode
npm run test:auth         # Auth tests only
npm run test:ci           # CI/CD pipeline
```

---

## 🌍 Environment Variables

### Required for Development
```env
DATABASE_URL                              # PostgreSQL connection string
NEXTAUTH_URL                              # App URL (http://localhost:3000)
AUTH_SECRET                               # NextAuth secret (min 32 chars)
GOOGLE_CLIENT_ID                          # Google OAuth
GOOGLE_CLIENT_SECRET                      # Google OAuth
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY          # Google Maps (client-side)
```

### Optional Services
```env
BLOB_READ_WRITE_TOKEN                     # Vercel Blob storage
TWILIO_ACCOUNT_SID                        # SMS/WhatsApp
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_WHATSAPP_NUMBER
SENDGRID_API_KEY                          # Email
SENDGRID_FROM_EMAIL
ADMIN_EMAILS                              # Auto-promote to ADMIN role
ADMIN_NOTIFICATION_EMAIL                  # Admin notifications
```

### Production Critical
```env
UPSTASH_REDIS_REST_URL                    # Rate limiting (REQUIRED)
UPSTASH_REDIS_REST_TOKEN
```

---

## 📦 Key Dependencies

### Runtime
- `@prisma/client` 5.22.0 - Database ORM
- `@trpc/server`, `@trpc/client`, `@trpc/react-query` 11.4.3 - API layer
- `@tanstack/react-query` 5.60.6 - State management
- `next` 14.2.15 - Framework
- `next-auth` 4.24.10 - Authentication
- `zod` 3.25.48 - Validation
- `react-hook-form` 7.57.0 - Forms
- `date-fns`, `date-fns-tz` - Date manipulation
- `@radix-ui/*` - UI primitives
- `tailwindcss` 3.4.1 - Styling

### Development
- `typescript` 5.6.3
- `eslint` 8.57.1 + custom rules
- `prettier` 3.3.3
- `@playwright/test` 1.54.1
- `prisma` 5.22.0
- `husky` 9.1.7 - Git hooks

---

## 🔄 Recent Changes Log

### 2025-10-10 (Full Refresh - This Session)
- **VERIFIED**: All critical architecture files and dependencies
- **UPDATED**: Statistics to reflect actual current state:
  - Routes: 36 (corrected from 39)
  - ESLint rules: 8 total (added 2 previously undocumented)
  - CLAUDE.md: 32KB, 835 lines (was 27KB)
  - TypeScript files: ~1,500 active source files
- **CONFIRMED**: 10 tRPC routers (9 active, 1 inactive billing router)
- **CONFIRMED**: 11 feature modules with 206 total TypeScript files
- **CONFIRMED**: 10 compliance docs (120KB total)
- **VALIDATED**: Pre-commit hooks active and functioning
- **COMMIT HISTORY**: Last 10 commits reviewed for recent changes
  - Latest: Cache-first analysis protocol implementation
  - Recent: Compliance enhancements, ESLint fixes, type improvements

### 2025-10-10 (Earlier)
- **ADDED**: Cache-first analysis protocol to CLAUDE.md Section 2
- **ENFORCEMENT**: New sessions automatically check for CLAUDE-AGENT-CONTEXT.md before full scan
- **TOKEN SAVINGS**: Reduces analysis from ~72k tokens to ~15k tokens (79% savings)
- **USER COMMANDS**: Added automatic recognition for "refresh", "what's changed", etc.

### 2025-10-09 (22:50)
- **REMOVED**: `/DEVELOPER-ONBOARDING-GUIDE.md` - No longer needed in project root
- **FIXED**: `/scripts/README.md` - Corrected validation/ directory references to commit-gate/
- **UPDATED**: Script documentation now 100% accurate with actual structure
- **VERIFIED**: All file paths and commands validated

### 2025-10-09 (Earlier)
- **CREATED**: `/docs/claude-agent-context/CLAUDE-AGENT-CONTEXT.md` - Initial version for token optimization
- **ANALYSIS**: Full codebase analysis completed (82K tokens)
- **CONTEXT**: Comprehensive understanding established

---

## 📝 Usage Notes for AI Assistants

### On "Analyze the codebase" request:
1. **Read this file first** (~2K tokens)
2. **Batch-read critical files** via `read_multiple_files`:
   - `prisma/schema.prisma`
   - `src/lib/auth.ts`
   - `src/server/trpc.ts`
   - `src/server/api/root.ts`
   - `src/utils/api.ts`
   - `src/middleware.ts`
   - `CLAUDE.md`
3. **Use Grep for verification** (~2K tokens):
   - `Grep: 'createTRPCRouter'` → Count routers
   - `Grep: 'enum.*Status'` → Find status enums
4. **Read additional files on-demand only**

**Total: ~15K tokens (vs 82K)**

### After making changes:
1. Update relevant sections in this file
2. Update "Last Updated" timestamp
3. Add entry to "Recent Changes Log"
4. Update "Context Hash" (optional)

### Periodic refresh:
- Every ~20 conversations, suggest full re-scan
- User can request: "refresh the codebase context"

---

## 🔗 Cross-References

- **Master Rules**: `/CLAUDE.md`
- **Compliance Guides**: `/docs/compliance/`
- **Developer Principles**: `/docs/guides/DEVELOPER-PRINCIPLES.md`
- **Testing Guide**: `/README-E2E-TESTING.md`
- **Main README**: `/README.md`

---

**END OF CONTEXT DOCUMENT**
