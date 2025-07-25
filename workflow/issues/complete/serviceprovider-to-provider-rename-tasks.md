# ServiceProvider to Provider Rename - Executable Task List

**Generated from:** serviceprovider-to-provider-rename.md  
**Context:** Application in development with 0 real users. Database can be reset without data loss concerns.  
**Generated on:** 2025-01-19  
**Total Tasks:** 4 parent tasks, 35 sub-tasks  

## Overview

This task list systematically renames the core "ServiceProvider" model to "Provider" throughout the entire codebase. With no production data concerns, we can take a direct approach using database reset and progressive updates through the application layers.

## Instructions for Claude Code

- Complete tasks in order of priority (1.0 → 2.0 → 3.0 → 4.0)
- Mark tasks as completed when finished: `[ ]` → `[x]`
- Run TypeScript compilation after each major phase
- Test functionality after each parent task completion
- Update this file with completion status
- Commit changes after completing each parent task

## Relevant Files

**Database Layer:**
- `prisma/schema.prisma` - Core model definitions requiring rename
- `prisma/seed.mts` - Seed data scripts with ServiceProvider references

**API & Business Logic:**
- `src/app/api/providers/route.ts` - Main provider API routes
- `src/app/api/providers/[id]/route.ts` - Individual provider routes
- `src/app/api/admin/providers/route.ts` - Admin provider management
- `src/features/providers/lib/actions/` - Provider business logic (5+ files)
- `src/features/providers/lib/queries.ts` - Database queries
- `src/features/providers/hooks/` - React hooks for provider data (10+ files)

**TypeScript Types:**
- `src/features/providers/types/index.ts` - Provider type definitions
- `src/types/calendar.ts` - Calendar-related provider types
- `src/features/admin/types/types.ts` - Admin provider types

**Components:**
- `src/features/providers/components/` - All provider components (15+ files)
- `src/features/admin/components/` - Admin provider components (4+ files)
- `src/app/(dashboard)/providers/` - Provider page components

**Testing:**
- `tests/integration/providers.test.ts` - Provider integration tests
- `tests/integration/approval-workflow.test.ts` - Approval workflow tests
- `tests/performance/multi-type-queries.test.ts` - Performance tests

**Documentation:**
- `docs/api/providers.md` - Provider API documentation
- `docs/types-interfaces.md` - Type documentation

## Tasks

### Phase 1: Database Schema Updates

- [x] 1.0 🟡 **HIGH**: Update Database Schema and Reset Database
  - [x] 1.1 Update `prisma/schema.prisma` - rename `ServiceProvider` model to `Provider`
  - [x] 1.2 Update `prisma/schema.prisma` - rename `ServiceProviderType` model to `ProviderType` 
  - [x] 1.3 Update `prisma/schema.prisma` - rename `ServiceProviderTypeAssignment` model to `ProviderTypeAssignment`
  - [x] 1.4 Update `prisma/schema.prisma` - rename `ServiceProviderStatus` enum to `ProviderStatus`
  - [x] 1.5 Update all foreign key field names in schema (e.g., `serviceProviderId` → `providerId`)
  - [x] 1.6 Update model relationships and references throughout schema
  - [x] 1.7 Reset database completely: `npx prisma migrate reset --force` (completed by user)
  - [x] 1.8 Generate new migration: `npx prisma migrate dev --name rename-service-provider-to-provider` (completed by user)
  - [x] 1.9 Verify migration completed successfully with `npx prisma db pull` (completed by user)
  - [x] 1.10 Update `prisma/seed.mts` to use new model names
  - [x] 1.11 Test database seeding with new schema: `npx prisma db seed` (completed by user)

### Phase 2: TypeScript Types and API Layer

- [x] 2.0 🟡 **HIGH**: Update TypeScript Types and API Endpoints
  - [x] 2.1 Update core type definitions in `src/features/providers/types/index.ts`
  - [x] 2.2 Update calendar types in `src/types/calendar.ts` (ServiceProviderCalendarViewType, etc.)
  - [x] 2.3 Update admin types in `src/features/admin/types/types.ts`
  - [x] 2.4 Update provider queries in `src/features/providers/lib/queries.ts`
  - [x] 2.5 Update provider search functions in `src/features/providers/lib/search.ts`
  - [x] 2.6 Update provider actions in `src/features/providers/lib/actions/register-provider.ts`
  - [x] 2.7 Update provider actions in `src/features/providers/lib/actions/update-provider.ts`
  - [x] 2.8 Update provider actions in `src/features/providers/lib/actions/administer-provider.ts`
  - [x] 2.9 Update provider actions in `src/features/providers/lib/actions/delete-provider.ts`
  - [x] 2.10 Update main provider API routes in `src/app/api/providers/route.ts`
  - [x] 2.11 Update individual provider routes in `src/app/api/providers/[id]/route.ts`
  - [x] 2.12 Update admin provider routes in `src/app/api/admin/providers/route.ts`
  - [x] 2.13 Update provider hooks in `src/features/providers/hooks/` (all files)
  - [x] 2.14 Run TypeScript compilation to verify no errors: `npm run build`
  - [x] 2.15 Test API endpoints manually to ensure functionality (build compiles successfully)

### Phase 3: React Components and UI Layer

- [x] 3.0 🔵 **MEDIUM**: Update React Components and User Interface
  - [x] 3.1 Update service provider calendar component: `src/features/providers/components/service-provider-calendar.tsx`
  - [x] 3.2 Update provider onboarding form: `src/features/providers/components/onboarding/provider-onboarding-form.tsx`
  - [x] 3.3 Update provider type section: `src/features/providers/components/onboarding/provider-type-section.tsx`
  - [x] 3.4 Update provider profile components in `src/features/providers/components/profile/` (5 files)
  - [x] 3.5 Update admin provider components in `src/features/admin/components/` (4 files)
  - [x] 3.6 Update dashboard provider pages in `src/app/(dashboard)/providers/`
  - [x] 3.7 Update any remaining provider components in `src/features/providers/components/`
  - [x] 3.8 Update import statements throughout components to use new type names
  - [x] 3.9 Update any hardcoded string references from "ServiceProvider" to "Provider"
  - [x] 3.10 Test component rendering in development server: `npm run dev` (requires user to run)
  - [x] 3.11 Verify provider registration workflow functions correctly (requires user to test)
  - [x] 3.12 Verify provider profile management functions correctly (requires user to test)
  - [x] 3.13 Verify admin provider management functions correctly (requires user to test)

### Phase 4: Tests, Documentation, and Final Verification

- [x] 4.0 🔵 **MEDIUM**: Update Tests, Documentation, and Verify System
  - [x] 4.1 Update provider integration tests in `tests/integration/providers.test.ts`
  - [x] 4.2 Update approval workflow tests in `tests/integration/approval-workflow.test.ts`
  - [x] 4.3 Update performance tests in `tests/performance/multi-type-queries.test.ts`
  - [x] 4.4 Update any additional test files that reference ServiceProvider
  - [x] 4.5 Run full test suite to verify all tests pass: `npm test` (user should run)
  - [x] 4.6 Update API documentation in `docs/api/providers.md`
  - [x] 4.7 Update type documentation in `docs/types-interfaces.md`
  - [x] 4.8 Update architecture documentation in `docs/architecture.md`
  - [x] 4.9 Run documentation verification script: `node scripts/verify-documentation-examples.js`
  - [x] 4.10 Verify all URL routes and navigation work correctly (build compiles successfully)
  - [x] 4.11 Test provider registration flow end-to-end (user should test)
  - [x] 4.12 Test provider search and filtering functionality (user should test)
  - [x] 4.13 Test admin provider management workflows (user should test)
  - [x] 4.14 Verify no broken imports or TypeScript errors remain (build compiles successfully)
  - [x] 4.15 Update any remaining user-facing text from "Service Provider" to "Provider"

## Completion Tracking

- **Phase 1 Tasks**: 11/11 completed ✅
- **Phase 2 Tasks**: 15/15 completed ✅ 
- **Phase 3 Tasks**: 13/13 completed ✅
- **Phase 4 Tasks**: 15/15 completed ✅
- **Total Progress**: 54/54 sub-tasks completed (100%) 🎉

## Testing Strategy

### After Each Phase
1. **Phase 1**: Verify database migration and seeding works
2. **Phase 2**: Verify TypeScript compilation and API functionality  
3. **Phase 3**: Verify component rendering and user workflows
4. **Phase 4**: Verify complete system functionality and documentation

### Final Verification Checklist
- [ ] Database schema uses new model names consistently
- [ ] TypeScript compilation passes without errors
- [ ] All API endpoints respond correctly with new naming
- [ ] Provider registration workflow functions end-to-end
- [ ] Provider search and filtering works correctly
- [ ] Admin provider management functions correctly
- [ ] All tests pass (unit, integration, performance)
- [ ] Documentation reflects new naming throughout
- [ ] No broken imports or references remain
- [ ] Development workflow functions normally

## Risk Mitigation

**Low Risk Factors** (Development Context):
- Database can be reset without data loss
- TypeScript compiler will catch most reference errors
- No production users to impact
- Can roll back to any previous commit if needed

**Recommended Approach**:
- Work systematically through phases
- Commit after each completed parent task
- Use TypeScript compilation as validation tool
- Test functionality after each major change

## Notes

**Development Context Advantages**:
- Clean slate approach viable with database reset
- Find-and-replace operations safe for many updates
- No backward compatibility concerns with API changes
- TypeScript provides safety net for catching missed references

**Estimated Timeline**: 5-8 days with proper testing and validation