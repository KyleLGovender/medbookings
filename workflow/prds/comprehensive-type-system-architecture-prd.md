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
1.1. All tRPC routers in `/src/server/api/routers/` must return Prisma query results directly for automatic type inference
1.2. Server procedures must call server actions from `/src/features/*/lib/actions.ts` for business logic
1.3. No manual type definitions at the server procedure level - rely on automatic inference
1.4. All server procedures must have proper input validation using Zod schemas

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
   - `types.ts` - Domain enums, business logic types, utility types
   - `schemas.ts` - Zod validation schemas for forms and user input  
   - `guards.ts` - Type guard functions for runtime type checking
4.2. Direct imports only: `import { Type } from '@/features/calendar/types/types'`
4.3. NO barrel exports: `import { Type } from '@/features/calendar/types'` is forbidden
4.4. Manual types limited to: Domain enums, form schemas, business logic, type guards, client-only types

### 5. Migration Requirements for Existing Code
5.1. **Hook Migration** (27 files): Remove type exports, ensure tRPC-only calls, simplify to thin wrappers
5.2. **Component Migration** (77 files): Replace manual type imports with tRPC type extraction
5.3. **Type File Audit** (31 files): Remove server data interfaces, keep only domain logic types  
5.4. **Page Component Migration** (54 files): Apply same component migration patterns
5.5. **Server Action Validation**: Ensure all 7 server action files follow Prisma-only pattern

### 6. Documentation Requirements
6.1. Update `/CLAUDE.md` with complete type system architecture documentation
6.2. Update `/src/workflow/docs/` with migration guides and examples
6.3. Create developer onboarding guide for the type system patterns
6.4. Document all type extraction patterns with real examples

## Non-Goals (Out of Scope)

1. **Performance Optimization**: This PRD focuses on type safety, not runtime performance improvements
2. **New Feature Development**: No new business features during this migration
3. **Database Schema Changes**: No Prisma schema modifications required
4. **UI/UX Changes**: No visual or user experience changes
5. **Third-Party Library Updates**: No major dependency updates unless required for type safety
6. **Legacy REST API Migration**: Exception APIs (auth, upload, webhooks) remain as REST

## Technical Considerations

### Architecture Compliance Checklist
- [ ] All server procedures return Prisma results directly
- [ ] All hooks are thin tRPC wrappers without type exports  
- [ ] All components extract types from `RouterOutputs`
- [ ] All manual types limited to domain logic only
- [ ] No client code imports Prisma directly
- [ ] Clear separation between tRPC types and manual types

### Migration File Categories

#### Category 1: tRPC Server Procedures (9 files)
**Location**: `/src/server/api/routers/`
**Files**: admin.ts, billing.ts, calendar.ts, debug.ts, invitations.ts, organizations.ts, profile.ts, providers.ts
**Requirements**: Ensure direct Prisma returns, proper server action calls, no manual types

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

#### Category 6: Server Actions (7 files)
**Location**: `/src/features/*/lib/actions.ts`  
**Requirements**: Validate Prisma-only usage, proper error handling
**Files**: admin, billing, calendar, communications, organizations, profile, reviews

### Implementation Phases

#### Phase 1: Foundation (Estimated: 2 days)
- Audit current type usage patterns across all files
- Document existing violations of the dual-source pattern
- Set up type extraction examples and migration templates

#### Phase 2: Server Layer (Estimated: 1 day)
- Validate all tRPC routers follow direct Prisma return pattern
- Ensure server actions are properly separated from client concerns
- Fix any server-side type safety violations

#### Phase 3: Hook Layer Migration (Estimated: 3 days)
- Migrate all 27 hook files to remove type exports
- Ensure hooks are thin tRPC wrappers only
- Validate no Prisma imports in client hooks

#### Phase 4: Component Migration (Estimated: 5 days) 
- Migrate all 77 feature components to use tRPC type extraction
- Replace manual type imports with `RouterOutputs` extraction
- Test all components for type safety compliance

#### Phase 5: Type File Cleanup (Estimated: 2 days)
- Audit all 31 type files to remove server data interfaces
- Keep only domain logic, enums, schemas, and type guards
- Validate clear separation between manual and tRPC types

#### Phase 6: Page Component Migration (Estimated: 3 days)
- Apply migration patterns to all 54 page components
- Ensure consistent type usage across all app routes
- Test full application for type safety compliance

#### Phase 7: Documentation & Validation (Estimated: 1 day)
- Update CLAUDE.md and workflow documentation
- Create developer guides and examples
- Final validation of 100% compliance across codebase

## Success Metrics

### Quantitative Metrics
1. **100% Type Safety Compliance**: All 200+ files follow dual-source pattern
2. **Zero Manual Server Types**: No manual interfaces duplicating server data
3. **Zero Type Exports from Hooks**: All 27 hook files are thin wrappers only
4. **100% Component Type Extraction**: All components extract types from `RouterOutputs`
5. **Clean Type Files**: All 31 type files contain only domain logic

### Qualitative Metrics
1. **Developer Experience**: Developers report improved IntelliSense and error detection
2. **Maintainability**: Type changes automatically propagate from server to client
3. **Code Review Efficiency**: Clear patterns make code reviews faster and more consistent
4. **Documentation Quality**: Comprehensive guides enable quick onboarding

### Validation Criteria
- [ ] TypeScript compilation with zero type errors
- [ ] All components receive proper type inference from server procedures
- [ ] No manual interfaces that duplicate server data remain
- [ ] All hooks are simple tRPC wrappers without type exports
- [ ] Documentation accurately reflects implemented patterns

## Open Questions

1. **Migration Timing**: Should this migration happen feature-by-feature or as a comprehensive effort?
2. **Testing Strategy**: How should we validate type safety during the migration process?
3. **Rollback Plan**: What's the rollback strategy if issues are discovered during migration?
4. **Performance Impact**: Are there any performance considerations with the new type extraction patterns?
5. **Team Coordination**: How should we coordinate this migration across multiple developers?

---

**Is this PRD accurate and complete for implementing the comprehensive type system architecture migration?**

Respond with 'Complete PRD' to complete the PRD generation.
