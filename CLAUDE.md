  This file provides guidance to Claude Code when working with the MedBookings repository.

  🔴 SECTION 1: CRITICAL RULES - ALWAYS ENFORCE

  FUNDAMENTAL PRINCIPLES

  ALWAYS:
  - MAXIMUM COGNITIVE EFFORT: Think hardest - use full analytical capacity
  - 95% CONFIDENCE RULE: Ask questions when confidence < 95%
  - VERIFY EVERYTHING: Never skip because it "looks fine" - check EVERYTHING
  - NO ASSUMPTIONS: Don't trust comments saying "this works" - test EVERYTHING
  - FOCUSED AGENT: Complete tasks and code changes systematically one-by-one, not using a 'Batch process' or a 'Task agent'
  - PREFER EDITING: Always edit existing code over creating new
  - NEXT.JS PRINCIPLES: Always strictly follow Next.js 14 App Router best practices
  - EXPLICIT CONFIRMATION: Require user satisfaction before marking tasks complete

  NEVER:
  - Use a 'Batch process' or a 'Task agent' to complete a task or code change
  - Add legacy fallback code (unless explicitly requested)
  - Implement when uncertain - clarify first
  - Create new code when existing code can be modified
  - Mark tasks complete without user satisfaction confirmation
  - Skip security for speed
  - Assume previous implementation is secure
  - Trust without verification
  - Deploy without complete testing
  - Write code to files without explicit user approval
  - Start development servers (user handles this)
  - Perform large refactors unless explicitly instructed
  - Create dummy/placeholder implementations
  - Give up on tasks - identify root causes instead

  📂 SECTION 2: CODE ANALYSIS & CONTEXT PROTOCOL

  📄 **Full Context Protocol**: See `/docs/CONTEXT-LOADING.md` for comprehensive context management rules, task-specific loading patterns, and context efficiency guidelines.

  Code Analysis Guidelines

  Before making any changes:
  1. Scan the entire project structure to understand organization and patterns.
  2. Confirm framework and tooling by examining package.json, config files
  3. Identify actual conventions used in project rather than assuming
  4. Validate assumptions by checking codebase evidence
  5. When reading a file, read it entirely - avoid duplicating existing code or misunderstanding

  Initial Context Loading (ALWAYS READ)

  Architecture Foundation:
  /src/app/layout.tsx          # App structure and providers
  /prisma/schema.prisma        # Database schema (source of truth)
  /src/server/api/root.ts      # API routes overview
  /package.json                # Dependencies and scripts
  /src/lib/auth.ts            # Authentication configuration

  Type System Overview:
  /src/utils/api.ts           # tRPC client setup and type exports
  /src/server/trpc.ts         # tRPC context and middleware (NOT api/trpc.ts)

  Feature-Specific Context Loading

  When working on a specific feature, read ALL of:

  /src/features/[feature]/
  ├── components/*    # All UI components
  ├── hooks/*        # Custom hooks and API calls
  ├── lib/*          # Server actions and utilities
  └── types/*        # Type definitions, schemas, guards

  /src/server/api/routers/[feature].ts  # tRPC procedures

  Task-Type Specific Context

  | Task Type        | Read First                                   | Then Read                                           |
  |------------------|----------------------------------------------|-----------------------------------------------------|
  | Database changes | /prisma/schema.prisma                        | Previous migrations, affected tRPC routers          |
  | New API endpoint | /src/server/api/root.ts, /src/server/trpc.ts | Similar existing routers for patterns               |
  | UI components    | /src/components/ui/ directory listing        | Parent components, related feature components       |
  | Authentication   | /src/lib/auth.ts, /src/middleware.ts         | Auth-related procedures in routers                  |
  | Forms            | Existing form patterns in feature            | Related schemas in /src/features/*/types/schemas.ts |
  | Error handling   | tRPC error patterns in /src/server/trpc.ts   | Error boundaries, tRPC error handling               |
  | Type errors      | Type definitions in feature folder           | /src/utils/api.ts for tRPC types                    |
  | Testing          | /e2e/tests/ for existing patterns            | Related feature test files                          |
  | Styling          | /src/app/globals.css, tailwind.config.ts     | Component-specific styles                           |
  | Performance      | Current implementation files                 | /src/lib/utils.ts for optimization utilities        |

  Integration Points

  - Calendar utilities → /src/features/calendar/lib/
  - Email/SMS → /src/lib/communications/
  - File uploads → /src/app/api/upload/
  - Payments → /src/features/billing/

  Context Management Rules

  Historical Context:
  - Check git history: git log -3 --oneline -- [file-path]

  Cross-Feature Dependencies:
  1. Import analysis: What does this feature import?
  2. Export analysis: What exports are used elsewhere?
  3. Database relations: What related entities exist?
  4. Shared hooks: What shared utilities are used?

  Smart Context Patterns:
  - Pattern match similar functionality first
  - Follow dependency trees through imports
  - Review database impact (schema, indexes, queries)
  - Trace type flow: Prisma → tRPC → API export → Component

  Context Efficiency:

  DO NOT READ (skip these entirely):
  - Files and folders specified in the .claudeignore file, including but not limited to: Test files (unless writing/fixing tests), Built/generated files (.next/, node_modules/).

  ALWAYS READ (and read completely when you do):
  - Files you're modifying (read entire file)
  - Files importing your modifications (read entire file)
  - Files exporting what you're using (read entire file)
  - Type definitions for handled data (read entire file)

  The rule: Skip irrelevant files, but when a file IS relevant, read it completely.

  🏗️ SECTION 3: ARCHITECTURE & TECH STACK

  Tech Stack

  - Framework: Next.js 14 with App Router
  - API: tRPC (type-safe, replacing REST)
  - Database: PostgreSQL with Prisma ORM
  - Auth: NextAuth.js with Google OAuth
  - UI: Radix UI + Tailwind CSS + shadcn/ui
  - State: tRPC + TanStack Query
  - Validation: Zod schemas
  - Testing: Playwright (e2e only)

  Type System Architecture

  📄 **Type Safety Patterns**: See `/docs/TYPE-SAFETY.md` for:
  - Prisma JSON field handling with Zod schemas and conversion helpers
  - Type guard implementation patterns (acceptable `as any` usage)
  - tRPC type extraction detailed examples
  - Common type errors and debugging solutions

  Type Source Rules:

  | Type Category  | Source | Import Pattern                          |
  |----------------|--------|-----------------------------------------|
  | Database Enums | Prisma | import { Status } from '@prisma/client' |
  | Domain Logic   | Manual | /features/*/types/types.ts              |
  | API Responses  | tRPC   | RouterOutputs['router']['procedure']    |

  Implementation Patterns:

  // Component Type Extraction - CORRECT
  import { type RouterOutputs } from '@/utils/api';
  type AdminProvider = RouterOutputs['admin']['getProviderById'];
  type ProviderList = RouterOutputs['admin']['getProviders'];
  type SingleProvider = ProviderList[number];

  // Hook Pattern - CORRECT (no type exports)
  export function useAdminProvider(id: string) {
    return api.admin.getProviderById.useQuery({ id });
  }

  // tRPC Procedure Pattern
  export const adminRouter = createTRPCRouter({
    getProviderById: adminProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.provider.findUnique({
          where: { id: input.id },
          include: { /* relations */ }
        });
      }),
  });

  Available Prisma Enums (import from @prisma/client):
  - User: UserRole
  - Provider: ProviderStatus, Languages, RequirementsValidationStatus
  - Organization: OrganizationStatus, OrganizationRole, MembershipStatus
  - Calendar: AvailabilityStatus, BookingStatus, SchedulingRule, SlotStatus
  - Billing: SubscriptionStatus, PaymentStatus, BillingInterval

  Data Flow Architecture

  Critical Pattern: Client → tRPC → Database

  // 1. Client Hook - calls tRPC
  export const useProviders = () => {
    return api.providers.getAll.useQuery();
  };

  // 2. tRPC Procedure - queries database (ONLY place for DB access)
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({
      include: { user: true, services: true }
    });
  });

  // 3. Server Action - business logic only (NO database)
  export async function createProvider(data) {
    await sendEmail(data.email);
    return { success: true, providerId: data.id }; // Metadata only
  }

  Rules:
  - Client hooks NEVER import Prisma
  - Database queries ONLY in tRPC procedures
  - Server actions return metadata only
  - Single database query per endpoint
  - Legacy REST only for: File uploads, Webhooks, Third-party integrations

  Project Structure

  src/
  ├── app/                    # Next.js routes
  ├── features/              # Feature modules
  │   └── [feature]/
  │       ├── components/    # Feature UI
  │       ├── hooks/        # tRPC hooks
  │       ├── lib/          # Server actions
  │       └── types/        # Domain types
  ├── server/api/routers/    # tRPC procedures (DB here)
  └── components/            # Shared UI

  Architecture Patterns

  Database Operations:
  // ALWAYS use transactions for multi-table operations
  await prisma.$transaction(async (tx) => {
    // Atomic operations only
  }, {
    maxWait: 10000,
    timeout: 20000
  });

  API Pattern (tRPC):
  // REQUIRED STRUCTURE - NEVER DEVIATE
  export const featureRouter = createTRPCRouter({
    procedureName: protectedProcedure
      .input(z.object({...}))  // Zod validation REQUIRED
      .query(async ({ ctx, input }) => {
        // 1. Authorization check first
        // 2. Business logic
        // 3. Error handling
      }),
  });

  Type Safety Chain:
  Database → Prisma Types → Zod Schemas → tRPC Types → Component Props
           ↑ Never break this chain

  Component Architecture:
  - Server Components by default
  - Client Components only when needed
  - Data fetching via tRPC hooks
  - Form handling with react-hook-form + zodResolver
  - Error boundaries around data-dependent sections

  Architectural Integrity Rules

  FORBIDDEN Patterns:
  // ❌ Cross-feature imports
  import { something } from '@/features/otherFeature'

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

  // ❌ Multiple DB queries per endpoint
  const result = await createProvider(input);
  return ctx.prisma.provider.findUnique({ id: result.id });

  REQUIRED Patterns:
  - NO Redux/Zustand/Context in features
  - State MUST live in tRPC/React Query
  - Feature components stay in feature folders
  - No business logic in /src/lib/* or shared components
  - Database access ONLY through tRPC procedures

  📋 SECTION 4: BUSINESS RULES

  Provider-Organization Relationships

  | Provider Type           | Availability       | Billing     |
  |-------------------------|--------------------|-------------|
  | Independent             | Online only        | Self-billed |
  | Organization-Associated | Physical locations | Per creator |

  - Exclusive scheduling: ONE entity per time period

  Status Flows

  PENDING_APPROVAL → APPROVED → TRIAL → ACTIVE
                  ↓            ↓       ↓
               REJECTED    EXPIRED  SUSPENDED

  - Provider approval requires ALL requirements approved
  - Rejection reasons mandatory
  - All admin actions logged with context

  Availability System

  | Creator      | Initial Status | Billing                         |
  |--------------|----------------|---------------------------------|
  | Provider     | ACCEPTED       | Provider subscription           |
  | Organization | PENDING        | Organization (after acceptance) |

  - Slot-based billing (not booking-based)
  - Base slots + tiered overage pricing

  Booking System

  - Types: Registered users, Guests (name/contact), Staff-created
  - Flow: PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
  - Rule: Can require provider confirmation

  Integrations

  Google Calendar:
  - Bidirectional sync
  - External events block slots
  - Auto Google Meet links
  - Webhook support

  Communications:
  - Email, SMS, WhatsApp
  - Automated triggers
  - Guest support

  ✅ SECTION 5: BUILD & QUALITY GATES

  Automatic Verification

  After EVERY file modification (run WITHOUT asking):
  npx tsc --noEmit && npm run build && npm run lint

  Before Marking Complete

  # ALL must pass:
  npx tsc --noEmit              # TypeScript validation
  npm run build                  # Build verification
  npm run lint                   # Linting check
  # npm run test                 # Request user to run if tests exist
  grep -n "console.log" src/    # Security check for logs

  Build Error Resolution Protocol

  1. Run npm run build to see full error output
  2. Provide a detailed analysis of what the error output is and generate a plan to address it
  3. Fix identified errors systematically (not trial-and-error)
  4. Re-run build after each fix and code edit
  5. Continue until build passes completely
  6. Never proceed with failing or timed-out build
  7. Never proceed with errors still present

  Build verification is mandatory before:
  - User creates PRs
  - Marking tasks complete
  - Moving to next implementation phase

  🔍 SECTION 6: VERIFICATION PROTOCOLS

  📄 **Complete Verification Checklist**: See `/docs/VERIFICATION-PROTOCOLS.md` for full route validation, data source verification, and build error resolution protocol.

  Route & Navigation Validation

  # Find all valid routes
  find app -type f -name "page.tsx" | sed 's/page.tsx//' | sort

  # Verify ALL href targets exist
  grep -r "href=\|navigate\|push(" --include="*.tsx" | grep -v "^//" | sort -u

  # Verify middleware coverage
  cat src/middleware.ts | grep "matcher:"

  Data Source Verification

  # Find mock/hardcoded data
  grep -r "Mock\|TODO\|hardcoded\|placeholder" --include="*.tsx"

  # Security scan
  grep -r "console\.(log|error|warn)" --include="*.ts*" | grep -v "// eslint-ignore"

  # Find type safety issues
  grep -r "any\|as any" --include="*.ts*"

  Performance & API Monitoring

  # Find N+1 queries
  grep -r "findMany.*include" --include="*.ts" -A 5

  # Check for missing pagination
  grep -r "findMany" --include="*.ts" | grep -v "take:"

  # Find polling patterns
  grep -r "useQuery.*{" -A 5 | grep -E "(refetch|poll|interval)"

  🏥 SECTION 7: HEALTHCARE COMPLIANCE

  📄 **Timezone Implementation Guide**: See `/docs/TIMEZONE-GUIDELINES.md` for:
  - Complete utility reference (`nowUTC()`, `startOfDaySAST()`, `endOfDaySAST()`, `formatSAST()`)
  - Pattern examples with before/after code (current time, date ranges, token expiry)
  - Testing strategies for timezone code
  - Debugging timezone issues and common violations

  📄 **Logging & PHI Protection**: See `/docs/LOGGING.md` for:
  - Logger API reference (`logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.audit()`)
  - PHI sanitization functions (`sanitizeEmail()`, `sanitizeName()`, `sanitizePhone()`)
  - Feature-based debug flag system
  - POPIA compliance requirements and Sprint 4 fixes

  POPIA Requirements

  - Audit trail for all PHI access
  - Consent tracking mechanism
  - Encryption for PHI fields
  - Session timeout enforcement (30 min)

  Provider Authentication

  - Provider verification flow complete
  - All provider routes have role verification
  - Provider approval workflow intact
  - No PHI data exposure in console logs

  Appointment Booking

  - NO double-booking possibilities
  - State machine validated
  - Calendar/availability sync complete
  - Timezone handling - UTC in database (South Africa is UTC+2)

  Booking Integrity Pattern

  // PREVENT DOUBLE-BOOKING - REQUIRED
  const slot = await tx.slot.findUnique({
    where: { id: slotId }
    // Use locking
  });
  if (slot.booking || slot.status !== 'AVAILABLE') {
    throw new Error('Slot unavailable');
  }

  🚨 SECTION 8: SECURITY CHECKLIST

  Authentication & Authorization

  - ALL routes have authentication checks
  - ALL API endpoints have proper authorization
  - Role-based access control enforced
  - Session timeout configured
  - CSRF protection implemented
  - Rate limiting on auth endpoints
  - OAuth implementations secure

  Input Validation & Data Protection

  - ALL user inputs sanitized (XSS prevention)
  - EVERY database field has Zod validation
  - File upload size/type restrictions
  - NO credentials in code
  - NO sensitive data in console.logs
  - NO PHI in error messages
  - Audit logging for PHI access

  ⚡ SECTION 9: PERFORMANCE REQUIREMENTS

  Database

  - Pagination for lists > 20 items (REQUIRED)
  - No unbounded queries (always use take:)
  - No N+1 queries (eager loading required)
  - Indexes on frequently queried columns
  - Transactions for multi-table operations

  Frontend

  - No unnecessary re-renders (memo/useMemo/useCallback)
  - Code splitting implemented (route-based mandatory)
  - Images use Next.js Image component (ALL images)
  - Lazy loading for routes
  - Debounce/throttle for frequent operations

  API

  - No API calls in loops
  - Cache GET requests (min 5 seconds REQUIRED)
  - Rate limiting on all endpoints
  - React Query settings optimized

  🐛 SECTION 10: BUG DETECTION PATTERNS

  📄 **Bug Detection Reference**: See `/docs/BUG-DETECTION.md` for complete debugging protocol and red flag priorities.

  React Issues

  // Memory Leak Pattern - DETECT & FIX
  useEffect(() => {
    const timer = setInterval(...);
    // MISSING: return () => clearInterval(timer);
  }, []);

  // Infinite Loop Pattern - PREVENT
  useEffect(() => {
    setState(value);  // Causes re-render
  }, [value]);  // Dependency causes loop

  Database Issues

  // N+1 Problem - NEVER ALLOW
  const users = await prisma.user.findMany();
  for (const user of users) {
    const posts = await prisma.post.findMany({  // BAD
      where: { userId: user.id }
    });
  }

  // Race Condition - USE TRANSACTIONS
  const slot = await prisma.slot.findUnique(...);
  if (slot.available) {  // BAD: No locking
    await prisma.booking.create(...);
  }

  📁 SECTION 11: FILE HIERARCHY & PROTECTION

  Critical Files (Handle with Extreme Caution)

  prisma/schema.prisma       # Database schema - ADDITIVE ONLY rule:
                            # ✅ ALLOWED: Adding new models, fields, or enum values
                            # ❌ FORBIDDEN: Removing/renaming without explicit user approval
                            # If removal needed: Ask user "This requires removing X. Approve?"
  src/server/trpc.ts        # tRPC configuration
  src/lib/auth.ts           # Authentication core
  src/lib/prisma.ts         # Database client
  src/middleware.ts         # Route protection
  .env                      # NEVER COMMIT

  High-Risk Files

  src/server/api/root.ts    # API root
  src/server/api/routers/*  # API endpoints
  src/app/layout.tsx        # App shell
  src/app/api/auth/*        # Auth routes
  src/components/ui/*       # UI library
  package.json              # Dependencies

  🔄 SECTION 12: DEVELOPMENT WORKFLOW

  📄 **Complete Workflow Guide**: See `/docs/DEVELOPMENT-WORKFLOW.md` for detailed task execution flow, development standards, and command execution policy.

  Task Execution Flow

  1. UNDERSTAND (95% confidence required)
    - Analyze architecture
    - Ask questions if unclear
    - Break down large tasks
  2. PLAN (get approval)
    - Architectural considerations
    - Edge cases identification
    - File modification list
  3. IMPLEMENT (complete, no placeholders)
    - Verify library syntax first
    - Follow existing patterns
    - Prefer editing over creating
  4. VERIFY (automatic)
    - Build, lint, type check
    - Fix all errors
    - Check for console.logs
  5. CONFIRM (user satisfaction)
    - Feature works as requested
    - No console errors
    - Performance acceptable

  Development Standards

  Forms:
  - React Hook Form + Zod
  - z.nativeEnum(PrismaEnum) for enums
  - z.record() for nested data

  Optimistic Updates:
  onMutate: async (variables) => {
    await queryClient.cancelQueries(['key']);
    const previous = queryClient.getQueryData(['key']);
    queryClient.setQueryData(['key'], optimisticData);
    return { previous };
  };

  File Conventions:
  - kebab-case naming
  - Direct imports (no barrels)
  - Single quotes, semicolons, arrow functions
  - 2 spaces, 100 char max lines

  🛠️ SECTION 13: TOOLS & UTILITIES

  📄 **CLAUDE.md Enforcement System**: See `/docs/ENFORCEMENT.md` for:
  - Three-layer enforcement architecture (IDE ESLint, Pre-commit hooks, CI/CD gates)
  - All validation rules with examples (timezone, type safety, architecture, PHI)
  - Setup instructions and troubleshooting guide
  - Extending the enforcement system with new rules

  📄 **Auto-Sync System**: See `/docs/CLAUDE-MD-AUTO-SYNC.md` for how CLAUDE.md changes automatically sync with enforcement rules using SHA-256 hash detection.

  MCP Tool Usage

  - PostgreSQL: mcp__postgres-server__
  - Filesystem: mcp__filesystem-server__
  - IDE: mcp__ide__
  - Playwright: mcp__playwright__

  Command Execution Policy

  NEVER execute directly:
  - npm run dev, npm run test (interactive/long-running)
  - Any interactive or server processes

  ALWAYS execute (for verification):
  - npm run build (to verify compilation)
  - npm run lint (to check code quality)
  - npx tsc --noEmit (to verify types)

  Safe to execute:
  - Simple file operations
  - grep, rg (ripgrep)

  Database Commands (Reference Only)

  npx prisma generate        # Generate Prisma client
  npx prisma db push        # Push schema (development)
  npx prisma studio         # Open database GUI
  docker compose up         # Start PostgreSQL locally
  # NEVER RUN: npx prisma migrate dev (interactive)

  🎯 SECTION 14: DEBUGGING & ISSUE DETECTION

  Issue Detection Checklist

  # Find all routes and verify
  grep -r "href=\|navigate\|push(" --include="*.tsx" | sort -u

  # Find mock/hardcoded data
  grep -r "Mock\|TODO\|hardcoded\|placeholder" --include="*.tsx"

  # Security scan
  grep -r "console.log\|console.error" --include="*.ts*"
  grep -r "any\|as any" --include="*.ts*"
  grep -r "TODO\|FIXME\|HACK" --include="*.ts*"

  Debugging Protocol

  1. REPRODUCE: Follow exact user click path
  2. TRACE: Follow complete data and navigation flow
  3. VERIFY: Check if routes/APIs actually exist
  4. IDENTIFY: Distinguish between mock and real data
  5. MONITOR: Watch terminal for unusual patterns
  6. REPORT: List all findings with specific file:line numbers

  Red Flags Priority

  🔴 CRITICAL: Authentication bypass, SQL injection, exposed credentials, PHI in logs

  🟠 HIGH: Race conditions, infinite loops, API calls firing continuously

  🟡 MEDIUM: Missing validation, no error handling, hardcoded data

  🚀 SECTION 15: DEPLOYMENT

  📄 **Production Deployment Guide**: See `/docs/DEPLOYMENT.md` for:
  - Complete environment variable reference (Database, Auth, Redis, Email, SMS)
  - Upstash Redis setup for rate limiting (CRITICAL for production)
  - Security verification checklist (POPIA compliance)
  - Post-deployment verification steps
  - Troubleshooting common deployment issues
  - Rollback procedures and incident response

  Critical Production Requirements

  - Upstash Redis configured for rate limiting (REQUIRED)
  - Strong AUTH_SECRET (minimum 32 characters, random)
  - All environment variables configured in deployment platform
  - Database migrations applied (npx prisma migrate deploy)
  - Security headers verified (HSTS, CSP, X-Frame-Options)

  ✅ SECTION 16: FINAL VERIFICATION

  Task Completion Criteria

  1. Build Passes: npm run build succeeds
  2. Types Valid: npx tsc --noEmit passes
  3. Lint Clean: npm run lint has no errors
  4. Security Check: No exposed credentials or PHI
  5. Performance: No N+1 queries or unbounded fetches
  6. User Confirms: Explicit satisfaction from user

  Quick Reference Checklist

  Before starting:
  - Task clarity 95%+ (ask questions if below)?
  - Architecture understood?
  - Plan created and approved?

  During development:
  - Library syntax verified?
  - Linting run after changes?
  - Full implementation (no dummies)?

  After completion:
  - Build passes all checks?
  - User explicitly confirms satisfaction?
  - Ready to commit or continue?

  ---
  REMEMBER: Maximum cognitive effort. Verify everything. Never assume. Always confirm.
  NO EXCEPTIONS: These rules are non-negotiable. User safety and data integrity depend on following them.
