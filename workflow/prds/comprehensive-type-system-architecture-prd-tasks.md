## Relevant Files

- `/src/server/api/routers/` - All tRPC router files that need to ensure direct Prisma returns and proper server action integration
- `/src/features/*/hooks/` - All 27 hook files that need migration to thin tRPC wrappers without type exports
- `/src/features/*/components/` - All 77 feature components that need to migrate from manual types to tRPC type extraction
- `/src/app/` - All 54 page components that need type migration patterns applied
- `/src/features/*/types/` - All 31 type files that need audit and cleanup to remove server data interfaces
- `/src/features/*/lib/` - All lib directory files that perform database operations and need migration to tRPC procedures
- `/CLAUDE.md` - Project documentation that needs comprehensive type system architecture updates
- `/src/utils/api.ts` - tRPC client configuration and RouterOutputs/RouterInputs exports
- `/workflow/docs/type-system-audit-report.md` - Comprehensive audit report documenting type system compliance status

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- This migration focuses on zero type drift and eliminates manual maintenance of server data types
- Critical requirement: All database operations must flow through tRPC procedures for complete type safety

## Tasks

- [ ] 1.0 Foundation & Type File Cleanup
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
  - [ ] 1.12 Ensure all remaining manual types are domain logic only (enums, form schemas, business logic, type guards)
  - [ ] 1.13 Set up type extraction examples and migration templates for development team

- [ ] 2.0 Server-Side Library Integration & Database Migration
  - [ ] 2.1 Audit ALL files in `/src/features/*/lib/` directories for database interactions (Prisma queries/mutations)
  - [ ] 2.2 Identify orphaned database functions not exposed through tRPC procedures (e.g., `getAvailabilityById`)
  - [ ] 2.3 Migrate admin lib functions: Convert all database operations in `/src/features/admin/lib/` to tRPC procedures
  - [ ] 2.4 Migrate billing lib functions: Convert all database operations in `/src/features/billing/lib/` to tRPC procedures
  - [ ] 2.5 Migrate calendar lib functions: Convert all database operations in `/src/features/calendar/lib/` to tRPC procedures
  - [ ] 2.6 Migrate communications lib functions: Convert all database operations in `/src/features/communications/lib/` to tRPC procedures
  - [ ] 2.7 Migrate invitations lib functions: Convert all database operations in `/src/features/invitations/lib/` to tRPC procedures
  - [ ] 2.8 Migrate organizations lib functions: Convert all database operations in `/src/features/organizations/lib/` to tRPC procedures
  - [ ] 2.9 Migrate profile lib functions: Convert all database operations in `/src/features/profile/lib/` to tRPC procedures
  - [ ] 2.10 Migrate providers lib functions: Convert all database operations in `/src/features/providers/lib/` to tRPC procedures
  - [ ] 2.11 Migrate reviews lib functions: Convert all database operations in `/src/features/reviews/lib/` to tRPC procedures
  - [ ] 2.12 Remove manual include configurations (e.g., `includeAvailabilityRelations`) from all server functions
  - [ ] 2.13 Replace manual type interfaces with tRPC automatic inference in all migrated functions
  - [ ] 2.14 Preserve utility functions and helpers that don't interact with database in lib directories

- [ ] 3.0 Server Layer Validation & tRPC Router Compliance
  - [ ] 3.1 Validate admin.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.2 Validate billing.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.3 Validate calendar.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.4 Validate debug.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.5 Validate invitations.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.6 Validate organizations.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.7 Validate profile.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.8 Validate providers.ts router follows direct Prisma return pattern and calls server actions properly
  - [ ] 3.9 Ensure all tRPC procedures have proper input validation using Zod schemas
  - [ ] 3.10 Fix any remaining server-side type safety violations
  - [ ] 3.11 Test that TypeScript build passes with all server actions integrated
  - [ ] 3.12 Verify no manual type definitions exist at server procedure level

- [ ] 4.0 Client Hook Layer Migration
  - [ ] 4.1 Migrate admin hooks: Remove type exports from `use-admin-providers.ts`, `use-admin-provider-approval.ts` and ensure tRPC-only calls
  - [ ] 4.2 Migrate organization hooks: Remove type exports from `use-organization.ts`, `use-organization-updates.ts` and ensure tRPC-only calls
  - [ ] 4.3 Migrate provider hooks: Remove type exports from `use-provider.ts`, `use-provider-updates.ts` and ensure tRPC-only calls
  - [ ] 4.4 Migrate calendar hooks: Remove type exports from `use-calendar-data.ts`, `use-availability.ts` and ensure tRPC-only calls
  - [ ] 4.5 Migrate remaining 19 hook files to thin tRPC wrappers without type exports
  - [ ] 4.6 Ensure all hooks follow naming convention `use[FeatureName][Action]`
  - [ ] 4.7 Validate no Prisma imports exist in any client hooks
  - [ ] 4.8 Update all hooks to use new tRPC procedures from Phase 2 migration
  - [ ] 4.9 Ensure all hooks are thin wrappers around tRPC queries/mutations only
  - [ ] 4.10 Test all hooks for proper tRPC integration and type safety

- [ ] 5.0 Feature Component Migration to tRPC Type Extraction
  - [ ] 5.1 Migrate priority admin components: `provider-list.tsx`, `provider-detail.tsx`, `organization-list.tsx`, `organization-detail.tsx`
  - [ ] 5.2 Migrate priority provider components: `provider-profile-view.tsx`, `provider-onboarding-form.tsx`
  - [ ] 5.3 Migrate priority organization components: `organization-profile-view.tsx`, `provider-network-manager.tsx`
  - [ ] 5.4 Migrate priority calendar components: `availability-creation-form.tsx`, `provider-calendar-view.tsx`
  - [ ] 5.5 Migrate remaining 67 feature components to use `RouterOutputs` type extraction
  - [ ] 5.6 Replace all manual type imports with `RouterOutputs['router']['procedure']` pattern
  - [ ] 5.7 Implement proper type extraction using `NonNullable<>` for nested types and `[number]` for array items
  - [ ] 5.8 Ensure clear separation: tRPC types for server data, manual types for domain logic
  - [ ] 5.9 Remove any manual interfaces that duplicate server data structures
  - [ ] 5.10 Test all components for type safety compliance and proper IntelliSense
  - [ ] 5.11 Validate all components use new tRPC procedures and type extraction patterns

- [ ] 6.0 Page Component Migration
  - [ ] 6.1 Apply tRPC type extraction patterns to all dashboard route components in `/src/app/(dashboard)/`
  - [ ] 6.2 Apply tRPC type extraction patterns to all general route components in `/src/app/(general)/`
  - [ ] 6.3 Apply tRPC type extraction patterns to all API route components in `/src/app/api/`
  - [ ] 6.4 Ensure consistent type usage across all 54 page components
  - [ ] 6.5 Replace manual type imports with RouterOutputs extraction in all page components
  - [ ] 6.6 Test full application for type safety compliance across all routes
  - [ ] 6.7 Validate proper integration with migrated hooks and components
  - [ ] 6.8 Ensure all page components follow dual-source type safety pattern

- [ ] 7.0 Documentation Update & Final Validation
  - [ ] 7.1 Update `/CLAUDE.md` with comprehensive type system architecture documentation
  - [ ] 7.2 Update `/src/workflow/docs/` with migration guides and real-world examples
  - [ ] 7.3 Create developer onboarding guide for dual-source type system patterns
  - [ ] 7.4 Document all type extraction patterns with concrete code examples
  - [ ] 7.5 Create troubleshooting guide for common type safety issues
  - [ ] 7.6 Final validation: Ensure 100% compliance across all 200+ files
  - [ ] 7.7 Verify TypeScript compilation with zero type errors
  - [ ] 7.8 Confirm all database operations properly integrated with tRPC (no orphaned functions)
  - [ ] 7.9 Validate all components receive proper type inference from server procedures
  - [ ] 7.10 Ensure no manual interfaces duplicating server data remain anywhere
  - [ ] 7.11 Confirm clean `/src/features/*/lib/` directories with only non-database utilities
  - [ ] 7.12 Test that documentation accurately reflects implemented patterns