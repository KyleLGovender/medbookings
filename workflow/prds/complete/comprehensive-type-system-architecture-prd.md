# Comprehensive Type System Architecture - PRD

## Introduction/Overview

The MedBookings platform requires a complete migration to a **dual-source type safety architecture** that establishes clear boundaries between manual domain types and tRPC-inferred API types. This migration will ensure zero type drift between server and client, eliminate type maintenance overhead, and provide maximum type safety across the entire application.

**Problem:** The current codebase has inconsistent type usage patterns, potential type drift between server and client code, and manual maintenance of types that should be automatically inferred from server procedures.

**Goal:** Implement a comprehensive, consistent type system architecture across the entire MedBookings codebase that provides end-to-end type safety while maintaining clear separation between domain logic and server data.

## Goals

1. **Achieve 100% Type Safety Compliance**: Every component, hook, and server procedure follows the dual-source type safety pattern
2. **Eliminate Type Drift**: All server data types are automatically inferred from tRPC procedures, ensuring zero drift
3. **Clear Type Boundaries**: Manual types for domain logic, tRPC types for server data - no exceptions
4. **Developer Experience**: Provide full IntelliSense and compile-time error detection across all features
5. **Maintainability**: Reduce type maintenance overhead by leveraging automatic type inference
6. **Documentation**: Complete documentation update to reflect the new architecture standards

## User Stories

### As a Frontend Developer

- I want all API data to be automatically typed so that I don't have to manually maintain interface definitions
- I want immediate compile-time feedback when server data structures change so that I can update my components accordingly
- I want clear patterns for extracting types so that I can work efficiently across different features

### As a Backend Developer

- I want my tRPC procedure return types to automatically flow to the frontend so that I don't need to manually update client types
- I want type safety when calling server actions from tRPC procedures so that I can catch errors at compile time
- I want clear separation between server business logic and client type definitions

### As a DevOps/Architect

- I want consistent type patterns across all features so that code reviews and maintenance are predictable
- I want automatic detection of type safety violations so that the architecture is enforced
- I want comprehensive documentation so that new team members can quickly understand and follow the patterns

## Functional Requirements

### 1. tRPC Server Infrastructure Requirements

1.1. All tRPC routers in `/src/server/api/routers/` must perform database queries directly using Prisma for automatic type inference
1.2. Server procedures must call server actions from `/src/features/*/lib/actions.ts` ONLY for business logic (validation, notifications, workflows)
1.3. Server actions must return minimal metadata only, never database results
1.4. No manual type definitions at the server procedure level - rely on automatic inference
1.5. All server procedures must have proper input validation using Zod schemas
1.6. Single database query per endpoint for optimal performance

### 2. Client Hook Architecture Requirements

2.1. All hooks in `/src/features/*/hooks/` must be thin wrappers around tRPC queries/mutations
2.2. Hooks must NOT export any type definitions - components handle their own type extraction
2.3. Hooks must NOT import Prisma directly - only call tRPC procedures
2.4. All hooks must follow the naming convention `use[FeatureName][Action]`

### 3. Component Type Extraction Requirements

3.1. All components using server data must extract types directly from `RouterOutputs['router']['procedure']`
3.2. Components must import `RouterOutputs` from `@/utils/api`
3.3. Use `NonNullable<>` for nested optional types and `[number]` for array item types
3.4. No manual interfaces that duplicate server data structures
3.5. Clear separation: use tRPC types for server data, manual types for domain logic

### 4. Manual Type Organization Requirements

4.1. Manual types must be organized in `/src/features/[feature-name]/types/` with the structure:

- `types.ts` - Business logic types, client-only types, utility types (NO Prisma enum duplicates)
- `schemas.ts` - Zod validation schemas for forms and user input
- `guards.ts` - Type guard functions for runtime type checking
  4.2. Direct imports only: `import { Type } from '@/features/calendar/types/types'`
  4.3. NO barrel exports: `import { Type } from '@/features/calendar/types'` is forbidden
  4.4. Manual types limited to: Client-only types, form schemas, business logic, type guards, calculated types
  4.5. All Prisma enums must be imported directly from `@prisma/client` - NO manual duplication

### 5. Prisma Type Import Requirements

5.1. **Direct Imports Only**: All Prisma enums must be imported from `@prisma/client` - no manual duplication
5.2. **Remove Duplicate Enums**: Delete all manually defined enums that exist in Prisma schema
5.3. **Update Import Paths**: Change all enum imports from feature type files to `@prisma/client`
5.4. **Keep Domain Types**: Retain client-only types, business logic types, and calculated types
5.5. **Zod Integration**: Use `z.nativeEnum(PrismaEnum)` for schema validation with Prisma enums

### 6. Migration Requirements for Existing Code

6.1. **Type File Audit** (31 files): Remove server data interfaces AND Prisma enum duplicates, keep only domain logic types
6.2. **Server-Side Library Integration** (All `/src/features/*/lib/` files): Convert server actions to business logic only, move database queries to tRPC procedures
6.3. **Hook Migration** (27 files): Remove type exports, ensure tRPC-only calls, simplify to thin wrappers
6.4. **Component Migration** (77 files): Replace manual type imports with tRPC type extraction and Prisma enum imports
6.5. **Page Component Migration** (54 files): Apply same component migration patterns
6.6. **Performance Optimization**: Eliminate duplicate database queries through efficient tRPC patterns

### 7. Documentation Requirements

7.1. Update `/CLAUDE.md` with complete type system architecture documentation
7.2. Update `/src/workflow/docs/` with migration guides and examples
7.3. Create developer onboarding guide for the type system patterns
7.4. Document all type extraction patterns with real examples
7.5. Document Prisma type import patterns and migration guide

## Non-Goals (Out of Scope)

1. **Performance Optimization**: This PRD focuses on type safety, not runtime performance improvements
2. **New Feature Development**: No new business features during this migration
3. **Database Schema Changes**: No Prisma schema modifications required
4. **UI/UX Changes**: No visual or user experience changes
5. **Third-Party Library Updates**: No major dependency updates unless required for type safety
6. **Legacy REST API Migration**: Exception APIs (auth, upload, webhooks) remain as REST

## Technical Considerations

### Architecture Compliance Checklist

- [ ] All database queries are performed directly in tRPC procedures for automatic type inference
- [ ] Server actions handle ONLY business logic (validation, notifications, workflows)
- [ ] Server actions return minimal metadata, never database results
- [ ] Single database query per tRPC endpoint (no duplicate queries)
- [ ] No manual include configurations (e.g., `includeAvailabilityRelations`) in any files
- [ ] All hooks are thin tRPC wrappers without type exports
- [ ] All components extract types from `RouterOutputs`
- [ ] All manual types limited to domain logic only (no Prisma enum duplicates)
- [ ] All Prisma enums imported directly from `@prisma/client`
- [ ] No manually duplicated enums that exist in Prisma schema
- [ ] No client code imports Prisma directly (except for enum imports)
- [ ] Clear separation between tRPC types, Prisma enums, and manual types
- [ ] Utility functions and non-database helpers can remain in `/src/features/*/lib/`
- [ ] No orphaned database operations outside of tRPC procedures

### Migration File Categories

#### Category 1: tRPC Server Procedures (9 files)

**Location**: `/src/server/api/routers/`
**Files**: admin.ts, billing.ts, calendar.ts, debug.ts, invitations.ts, organizations.ts, profile.ts, providers.ts
**Requirements**: Perform database queries directly with Prisma, call server actions only for business logic, single query per endpoint, no manual types

#### Category 2: Client Hooks (27 files)

**Location**: `/src/features/*/hooks/`
**Requirements**: Remove type exports, ensure tRPC-only calls, simplify to thin wrappers
**Key Files**:

- `use-admin-providers.ts`, `use-admin-provider-approval.ts`
- `use-organization.ts`, `use-organization-updates.ts`
- `use-provider.ts`, `use-provider-updates.ts`
- `use-calendar-data.ts`, `use-availability.ts`
- And 19 additional hook files

#### Category 3: React Components (77 files)

**Location**: `/src/features/*/components/`
**Requirements**: Replace manual type imports with tRPC type extraction
**Priority Components**:

- **Admin Components**: provider-list.tsx, provider-detail.tsx, organization-list.tsx, organization-detail.tsx
- **Provider Components**: provider-profile-view.tsx, provider-onboarding-form.tsx
- **Organization Components**: organization-profile-view.tsx, provider-network-manager.tsx
- **Calendar Components**: availability-creation-form.tsx, provider-calendar-view.tsx

#### Category 4: Type Files Audit (31 files)

**Location**: `/src/features/*/types/`
**Requirements**: Remove server data interfaces, keep domain logic only
**Files by Feature**:

- **Admin**: types.ts, schemas.ts, guards.ts
- **Billing**: interfaces.ts, enums.ts, types.ts, schemas.ts, guards.ts
- **Calendar**: types.ts, schemas.ts, guards.ts
- **Communications**: interfaces.ts, enums.ts, types.ts, schemas.ts
- **Invitations**: types.ts, schemas.ts, guards.ts
- **Organizations**: types.ts, schemas.ts, guards.ts
- **Profile**: interfaces.ts, enums.ts, types.ts, schemas.ts
- **Providers**: types.ts, schemas.ts, guards.ts
- **Reviews**: interfaces.ts, enums.ts, types.ts, schemas.ts

#### Category 5: Page Components (54 files)

**Location**: `/src/app/`
**Requirements**: Apply component migration patterns to all page components

#### Category 6: Server-Side Library Integration (All `/src/features/*/lib/` files)

**Location**: `/src/features/*/lib/` (all files, not just actions.ts)
**Scope**: Convert server actions to business logic only, move all database queries to tRPC procedures
**Requirements**: Refactor server actions to handle only validation/notifications/workflows, ensure all database queries happen in tRPC procedures
**Critical Changes Required**:

- Move database queries from server actions to tRPC procedures for automatic type inference
- Convert server actions to return minimal metadata only (IDs, success flags, error messages)
- Remove manual include configurations (e.g., `includeAvailabilityRelations`) - let tRPC handle relations
- Eliminate duplicate database queries between server actions and tRPC procedures
- Single database query per endpoint pattern for optimal performance
- Utility functions, helpers, and other non-database code can remain in lib directories
  **File Types**: actions.ts (business logic only), utils.ts, helpers.ts, validators.ts, and any other non-database files

### Implementation Phases

#### Phase 1: Foundation & Type File Cleanup (Estimated: 2 days)

- Audit current type usage patterns across all files
- Remove server data interfaces from all 31 type files, keep only domain logic
- Document existing violations of the dual-source pattern
- Set up type extraction examples and migration templates

#### Phase 2: Server-Side Library Integration (Estimated: 3 days)

- **Critical Phase**: Convert server actions to business logic only, move database queries to tRPC procedures
- Audit ALL files in `/src/features/*/lib/` directories for database interactions
- Refactor server actions to handle only validation, notifications, and business workflows
- Move all database queries from server actions to tRPC procedures for automatic type inference
- Convert server actions to return minimal metadata (IDs, success flags, error messages)
- Remove manual include configurations (e.g., `includeAvailabilityRelations`)
- Implement single database query per endpoint pattern for optimal performance
- Eliminate duplicate database queries between server actions and tRPC procedures
- Preserve utility functions and helpers that don't interact with database

#### Phase 3: Server Layer Validation (Estimated: 1 day)

- Validate all tRPC routers perform database queries directly with Prisma
- Ensure server actions handle only business logic and return minimal metadata
- Verify single database query per endpoint pattern implementation
- Fix any remaining server-side type safety violations
- Test that build passes with all refactored server actions

#### Phase 4: Hook Layer Migration (Estimated: 3 days)

- Migrate all 27 hook files to remove type exports
- Ensure hooks are thin tRPC wrappers only
- Validate no Prisma imports in client hooks
- Update hooks to use new tRPC procedures from Phase 2

#### Phase 5: Component Migration (Estimated: 5 days)

- Migrate all 77 feature components to use tRPC type extraction
- Replace manual type imports with `RouterOutputs` extraction
- Test all components for type safety compliance
- Ensure components use new tRPC procedures

#### Phase 6: Page Component Migration (Estimated: 3 days)

- Apply migration patterns to all 54 page components
- Ensure consistent type usage across all app routes
- Test full application for type safety compliance

#### Phase 7: Documentation & Validation (Estimated: 1 day)

- Update CLAUDE.md and workflow documentation
- Create developer guides and examples
- Final validation of 100% compliance across codebase
- Verify TypeScript compilation with zero errors

## Success Metrics

### Quantitative Metrics

1. **100% Type Safety Compliance**: All 200+ files follow dual-source pattern
2. **Zero Duplicate Database Queries**: Single database query per tRPC endpoint
3. **Zero Database Operations in Server Actions**: All server actions handle only business logic
4. **Zero Manual Server Types**: No manual interfaces duplicating server data
5. **Zero Type Exports from Hooks**: All 27 hook files are thin wrappers only
6. **100% Component Type Extraction**: All components extract types from `RouterOutputs`
7. **Clean Type Files**: All 31 type files contain only domain logic
8. **Efficient Server Actions**: All server actions return minimal metadata only
9. **Clean Lib Directories**: Only utility functions and non-database helpers remain in `/src/features/*/lib/`

### Qualitative Metrics

1. **Developer Experience**: Developers report improved IntelliSense and error detection
2. **Maintainability**: Type changes automatically propagate from server to client
3. **Code Review Efficiency**: Clear patterns make code reviews faster and more consistent
4. **Documentation Quality**: Comprehensive guides enable quick onboarding

### Validation Criteria

- [ ] TypeScript compilation with zero type errors
- [ ] All database queries performed directly in tRPC procedures (no database operations in server actions)
- [ ] Single database query per tRPC endpoint (no duplicate queries)
- [ ] All server actions return minimal metadata only
- [ ] All components receive proper type inference from server procedures
- [ ] No manual interfaces that duplicate server data remain
- [ ] No manual include configurations in any files
- [ ] All hooks are simple tRPC wrappers without type exports
- [ ] Clean `/src/features/*/lib/` directories with only non-database utilities
- [ ] Documentation accurately reflects implemented efficient patterns

## Open Questions

1. **Migration Timing**: Should this migration happen feature-by-feature or as a comprehensive effort?
2. **Testing Strategy**: How should we validate type safety during the migration process?
3. **Rollback Plan**: What's the rollback strategy if issues are discovered during migration?
4. **Performance Impact**: Are there any performance considerations with the new type extraction patterns?
5. **Team Coordination**: How should we coordinate this migration across multiple developers?

---

**Is this PRD accurate and complete for implementing the comprehensive type system architecture migration?**

Respond with 'Complete PRD' to complete the PRD generation.
