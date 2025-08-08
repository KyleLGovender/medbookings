## Relevant Files

- `/src/server/api/routers/` - All tRPC router files that need to ensure direct Prisma returns and proper server action integration
- `/src/features/*/hooks/` - All 27 hook files that need migration to thin tRPC wrappers without type exports
- `/src/features/*/components/` - All 77 feature components that need to migrate from manual types to tRPC type extraction
- `/src/app/` - All 54 page components that need type migration patterns applied
- `/src/features/*/types/` - All 31 type files that need audit and cleanup to remove server data interfaces
- `/src/features/*/lib/` - All lib directory files that perform database operations and need migration to tRPC procedures
- `/CLAUDE.md` - Project documentation that needs comprehensive type system architecture updates
- `/src/utils/api.ts` - tRPC client configuration and RouterOutputs/RouterInputs exports
- `/workflow/docs/comprehensive-type-system-architecture/type-system-audit-report.md` - Comprehensive audit report documenting type system compliance status across all features
- `/workflow/docs/comprehensive-type-system-architecture/type-categorization-verification.md` - Verification report confirming all manual types are domain logic only
- `/workflow/docs/comprehensive-type-system-architecture/trpc-type-extraction-guide.md` - Comprehensive 900+ line guide for extracting types from tRPC RouterOutputs with examples
- `/workflow/docs/comprehensive-type-system-architecture/type-extraction-quick-reference.md` - One-page quick reference card for developers during migration
- `/workflow/docs/comprehensive-type-system-architecture/server-lib-audit-report.md` - Detailed audit of all lib directories identifying 22 files with database interactions
- `/workflow/docs/comprehensive-type-system-architecture/orphaned-functions-report.md` - Critical analysis of 25+ database functions not exposed through tRPC procedures
- `/workflow/docs/comprehensive-type-system-architecture/migration-templates.md` - Copy-paste templates for common migration patterns with before/after examples
- `/workflow/docs/comprehensive-type-system-architecture/type-organization-standards.md` - Standards and conventions for type organization and architecture
- `/workflow/docs/comprehensive-type-system-architecture/types-interfaces.md` - Interface design patterns and type relationship documentation
- `/workflow/docs/comprehensive-type-system-architecture/prisma-type-import-migration.md` - Comprehensive guide for migrating from duplicate enums to direct Prisma imports

### Documentation Summary

**Phase 1 Complete**: Comprehensive documentation package created in `/workflow/docs/comprehensive-type-system-architecture/`:

1. **Audit Reports**: Complete analysis of current state (type-system-audit-report.md, type-categorization-verification.md)
2. **Server Analysis**: Detailed findings on lib directories and orphaned functions (server-lib-audit-report.md, orphaned-functions-report.md)
3. **Migration Guides**: Step-by-step guides and templates (trpc-type-extraction-guide.md, migration-templates.md)
4. **Developer Resources**: Quick reference and standards (type-extraction-quick-reference.md, type-organization-standards.md)
5. **Architecture Documentation**: Type relationships and interface patterns (types-interfaces.md)

**Status**: Ready for development team use during remaining migration phases.

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- This migration focuses on zero type drift and eliminates manual maintenance of server data types
- **Critical requirement: Option C Architecture - Server actions handle ONLY business logic, tRPC procedures handle ALL database queries directly**
- **Performance optimization: Single database query per tRPC endpoint eliminates duplicate queries and improves response times**

## Tasks

- [x] 1.0 Foundation & Type File Cleanup
  - [x] 1.1 Audit current type usage patterns across all 31 type files in `/src/features/*/types/`
  - [x] 1.2 Document existing violations of the dual-source pattern in all features
  - [x] 1.3 Remove server data interfaces from admin types (types.ts, schemas.ts, guards.ts)
  - [x] 1.4 Remove server data interfaces from billing types (interfaces.ts, enums.ts, types.ts, schemas.ts, guards.ts)
  - [x] 1.5 Remove server data interfaces from calendar types (types.ts, schemas.ts, guards.ts)
  - [x] 1.6 Remove server data interfaces from communications types (interfaces.ts, enums.ts, types.ts, schemas.ts)
  - [x] 1.7 Remove server data interfaces from invitations types (types.ts, schemas.ts, guards.ts)
  - [x] 1.8 Remove server data interfaces from organizations types (types.ts, schemas.ts, guards.ts)
  - [x] 1.9 Remove server data interfaces from profile types (interfaces.ts, enums.ts, types.ts, schemas.ts)
  - [x] 1.10 Remove server data interfaces from providers types (types.ts, schemas.ts, guards.ts)
  - [x] 1.11 Remove server data interfaces from reviews types (interfaces.ts, enums.ts, types.ts, schemas.ts)
  - [x] 1.12 Ensure all remaining manual types are domain logic only (enums, form schemas, business logic, type guards)
  - [x] 1.13 Set up type extraction examples and migration templates for development team

- [x] 2.0 Server-Side Library Integration & Efficient Data Flow Migration
  - [x] 2.1 Audit ALL files in `/src/features/*/lib/` directories for database interactions (Prisma queries/mutations)
  - [x] 2.2 Identify database operations that need to be moved from server actions to tRPC procedures
  - [x] 2.3 Refactor admin lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.4 Refactor billing lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.5 Refactor calendar lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.6 Refactor communications lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.7 Refactor invitations lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.8 Refactor organizations lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.9 Refactor profile lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.10 Refactor providers lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.11 Refactor reviews lib functions: Convert server actions to business logic only, move database queries to tRPC procedures
  - [x] 2.12 Convert server actions to return minimal metadata only (IDs, success flags, error messages)
  - [x] 2.13 Implement single database query per tRPC endpoint pattern (eliminate duplicate queries)
  - [x] 2.14 Remove manual include configurations (e.g., `includeAvailabilityRelations`) from all files
  - [x] 2.15 Preserve utility functions and helpers that don't interact with database in lib directories

**Phase 2 Migration Summary (Tasks 2.3-2.11)**:
- ✅ **Admin**: Refactored - server actions handle business logic only, tRPC procedures handle all database queries
- ✅ **Billing**: Refactored - converted to efficient single-query pattern  
- ✅ **Calendar**: Refactored - moved database operations to tRPC, server actions handle validation/notifications only
- ✅ **Communications**: Refactored - notification logic in server actions, no duplicate database queries
- ✅ **Invitations**: No lib directory - already clean
- ✅ **Organizations**: Refactored - optimized for single database query per endpoint
- ✅ **Profile**: Refactored - separated business logic from database operations
- ✅ **Providers**: Refactored - converted to efficient tRPC pattern with minimal server action metadata
- ✅ **Reviews**: Clean - no database operations in lib files

**Phase 2 Complete**: Option C architecture fully implemented - server actions return metadata only, single database query per tRPC endpoint

- [ ] 3.0 Prisma Type Import Migration
  - [x] 3.1 Audit all manual type files for Prisma enum duplicates (document in prisma-type-import-migration.md)
  - [x] 3.2 Remove duplicate enums from admin types: AdminApprovalStatus, AdminActionType, UserRole
  - [ ] 3.3 Remove duplicate enums from billing types: BillingStatus, PaymentStatus, SubscriptionStatus, SubscriptionTier, BillingPeriod
  - [ ] 3.4 Remove duplicate enums from calendar types: AvailabilityStatus, BookingStatus, RecurrenceFrequency, DayOfWeek, AvailabilityType, SlotStatus
  - [ ] 3.5 Remove duplicate enums from communications types: CommunicationType, NotificationStatus, NotificationChannel
  - [ ] 3.6 Remove duplicate enums from organizations types: OrganizationStatus, OrganizationRole, OrganizationBillingModel, MembershipStatus, InvitationStatus
  - [ ] 3.7 Remove duplicate enums from profile types: UserRole, AccountProvider
  - [ ] 3.8 Remove duplicate enums from providers types: ProviderStatus, RequirementsValidationStatus, RequirementValidationType, Languages, RequirementSubmissionStatus
  - [ ] 3.9 Remove duplicate enums from reviews types: ReviewStatus, ReviewRating
  - [ ] 3.10 Update all component imports to use @prisma/client for enums
  - [ ] 3.11 Update all hook imports to use @prisma/client for enums
  - [ ] 3.12 Update all server action imports to use @prisma/client for enums
  - [ ] 3.13 Update Zod schemas to use z.nativeEnum() with Prisma enums
  - [ ] 3.14 Verify TypeScript compilation after enum migration
  - [ ] 3.15 Document final Prisma type import patterns in CLAUDE.md

- [ ] 4.0 Server Layer Validation & Efficient tRPC Pattern Compliance
  - [x] 4.1 Validate admin.ts router performs database queries directly and uses server actions only for business logic
  - [ ] 4.2 Validate billing.ts router implements single database query per endpoint pattern
  - [ ] 4.3 Validate calendar.ts router follows efficient Option C architecture (no duplicate queries)
  - [ ] 4.4 Validate debug.ts router performs database queries directly with automatic type inference
  - [ ] 4.5 Validate invitations.ts router follows single-query pattern with minimal server action metadata
  - [x] 4.6 Validate organizations.ts router eliminates duplicate database operations
  - [ ] 4.7 Validate profile.ts router separates business logic from database queries effectively
  - [ ] 4.8 Validate providers.ts router implements efficient data flow pattern
  - [ ] 4.9 Ensure all tRPC procedures have proper input validation using Zod schemas
  - [ ] 4.10 Verify server actions return minimal metadata only (no database results)
  - [ ] 4.11 Test that TypeScript build passes with all refactored server patterns
  - [ ] 4.12 Verify no manual type definitions exist at server procedure level
  - [ ] 4.13 Confirm single database query per endpoint across all routers

- [ ] 5.0 Client Hook Layer Migration
  - [x] 5.1 Migrate admin hooks: Remove type exports from `use-admin-providers.ts`, `use-admin-provider-approval.ts` and ensure tRPC-only calls
  - [x] 5.2 Migrate organization hooks: Remove type exports from `use-organization.ts`, `use-organization-updates.ts` and ensure tRPC-only calls
  - [ ] 5.3 Migrate provider hooks: Remove type exports from `use-provider.ts`, `use-provider-updates.ts` and ensure tRPC-only calls
  - [ ] 5.4 Migrate calendar hooks: Remove type exports from `use-calendar-data.ts`, `use-availability.ts` and ensure tRPC-only calls
  - [ ] 5.5 Migrate remaining 19 hook files to thin tRPC wrappers without type exports
  - [ ] 5.6 Ensure all hooks follow naming convention `use[FeatureName][Action]`
  - [ ] 5.7 Validate no Prisma imports exist in any client hooks
  - [ ] 5.8 Update all hooks to use new tRPC procedures from Phase 2 migration
  - [ ] 5.9 Ensure all hooks are thin wrappers around tRPC queries/mutations only
  - [ ] 5.10 Test all hooks for proper tRPC integration and type safety

- [ ] 6.0 Feature Component Migration to tRPC Type Extraction
  - [x] 6.1 Migrate priority admin components: `provider-list.tsx`, `provider-detail.tsx`, `organization-list.tsx`, `organization-detail.tsx`
  - [ ] 6.2 Migrate priority provider components: `provider-profile-view.tsx`, `provider-onboarding-form.tsx`
  - [ ] 6.3 Migrate priority organization components: `organization-profile-view.tsx`, `provider-network-manager.tsx`
  - [ ] 6.4 Migrate priority calendar components: `availability-creation-form.tsx`, `provider-calendar-view.tsx`
  - [ ] 6.5 Migrate remaining 67 feature components to use `RouterOutputs` type extraction
  - [ ] 6.6 Replace all manual type imports with `RouterOutputs['router']['procedure']` pattern
  - [ ] 6.7 Implement proper type extraction using `NonNullable<>` for nested types and `[number]` for array items
  - [ ] 6.8 Ensure clear separation: tRPC types for server data, manual types for domain logic
  - [ ] 6.9 Remove any manual interfaces that duplicate server data structures
  - [ ] 6.10 Test all components for type safety compliance and proper IntelliSense
  - [ ] 6.11 Validate all components use new tRPC procedures and type extraction patterns

- [ ] 7.0 Page Component Migration
  - [ ] 7.1 Apply tRPC type extraction patterns to all dashboard route components in `/src/app/(dashboard)/`
  - [ ] 7.2 Apply tRPC type extraction patterns to all general route components in `/src/app/(general)/`
  - [ ] 7.3 Apply tRPC type extraction patterns to all API route components in `/src/app/api/`
  - [ ] 7.4 Ensure consistent type usage across all 54 page components
  - [ ] 7.5 Replace manual type imports with RouterOutputs extraction in all page components
  - [ ] 7.6 Test full application for type safety compliance across all routes
  - [ ] 7.7 Validate proper integration with migrated hooks and components
  - [ ] 7.8 Ensure all page components follow dual-source type safety pattern

- [ ] 8.0 Documentation Update & Final Validation
  - [ ] 8.1 Update `/CLAUDE.md` with comprehensive type system architecture documentation
  - [ ] 8.2 Update `/workflow/docs/comprehensive-type-system-architecture/` with migration guides and real-world examples
  - [ ] 8.3 Create developer onboarding guide for dual-source type system patterns
  - [ ] 8.4 Document all type extraction patterns with concrete code examples
  - [ ] 8.5 Create troubleshooting guide for common type safety issues
  - [ ] 8.6 Final validation: Ensure 100% compliance across all 200+ files
  - [ ] 8.7 Verify TypeScript compilation with zero type errors
  - [ ] 8.8 Confirm all database operations properly integrated with tRPC (no orphaned functions)
  - [ ] 8.9 Validate all components receive proper type inference from server procedures
  - [ ] 8.10 Ensure no manual interfaces duplicating server data remain anywhere
  - [ ] 8.11 Confirm clean `/src/features/*/lib/` directories with only non-database utilities
  - [ ] 8.12 Test that documentation accurately reflects implemented patterns
