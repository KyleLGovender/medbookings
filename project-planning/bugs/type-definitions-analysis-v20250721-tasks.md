# Type Definitions Standardization Tasks
**Generated from**: `type-definitions-analysis-v20250721.md`  
**Date**: January 21, 2025  
**Total Tasks**: 33+ type relocations and standardization improvements

## Overview

This task list addresses critical type definition inconsistencies across all features, implementing a standardized approach based on the bulletproof-react pattern without barrel exports. The calendar feature serves as the formatting gold standard.

## Relevant Files

- `src/features/calendar/types/types.ts` - Gold standard formatting pattern to replicate
- `src/features/calendar/types/schemas.ts` - Schema formatting pattern to replicate
- `src/lib/types.ts` - Contains ApiResponse type that needs relocation
- `src/types/calendar.ts` - Calendar-specific types misplaced in global directory
- `src/features/*/types/` - Various fragmented type files across features
- `src/features/calendar/lib/*.ts` - 20+ service types scattered across lib files
- `src/features/providers/lib/provider-types.ts` - Business types in wrong location
- `src/features/providers/hooks/types.ts` - Business types in hooks directory
- `src/features/organizations/hooks/*.ts` - Business types in hooks

## Tasks

### 🔴 Critical Priority - Global Type Relocations

- [x] 1.0 🔴 **CRITICAL**: Move Global ApiResponse Type ✅ **COMPLETED**
  - [x] 1.1 Create `/src/types/api.ts` with proper formatting
  - [x] 1.2 Move `ApiResponse<T>` from `/src/lib/types.ts` to `/src/types/api.ts`
  - [x] 1.3 Update all imports across codebase (search for `@/lib/types` imports)
  - [x] 1.4 Delete `/src/lib/types.ts` after verifying no remaining references
  - [x] 1.5 Test that all API responses still work correctly
  - [x] 1.6 Run TypeScript compiler to verify no type errors
  - [x] 1.7 Run build process to ensure no compilation issues

- [x] 2.0 🔴 **CRITICAL**: Move Calendar Types from Global Directory ✅ **COMPLETED**
  - [x] 2.1 Review `/src/types/calendar.ts` and identify all types to move
  - [x] 2.2 Move `CalendarViewType`, `ProviderCalendarViewType`, `TimeRange` to `/src/features/calendar/types/types.ts`
  - [x] 2.3 Apply proper formatting with section headers and organization
  - [x] 2.4 Update all imports referencing `/src/types/calendar.ts`
  - [x] 2.5 Delete `/src/types/calendar.ts` after migration
  - [x] 2.6 Test calendar components still render correctly
  - [x] 2.7 Verify no build or type errors remain

### 🔴 Critical Priority - Calendar Feature Type Consolidation (20+ Types)

- [x] 3.0 🔴 **CRITICAL**: Move Calendar Lib Service Types ✅ **COMPLETED**
  - [x] 3.1 Move `BookingView` interface from `/src/features/calendar/lib/types.ts`
  - [x] 3.2 Move `SlotGenerationOptions`, `SlotGenerationResult` from `/src/features/calendar/lib/slot-generation.ts`
  - [x] 3.3 Move `AvailabilityValidationOptions`, `ValidationResult` from `/src/features/calendar/lib/availability-validation.ts`
  - [x] 3.4 Move all types from `/src/features/calendar/lib/location-search-service.ts`
  - [x] 3.5 Move all types from `/src/features/calendar/lib/time-search-service.ts`
  - [x] 3.6 Move all types from `/src/features/calendar/lib/workflow-service.ts`
  - [x] 3.7 Move all types from `/src/features/calendar/lib/booking-integration.ts`
  - [x] 3.8 Move all types from `/src/features/calendar/lib/slot-cleanup-service.ts`
  - [x] 3.9 Add all moved types to appropriate sections in `/src/features/calendar/types/types.ts`
  - [x] 3.10 Update imports in all calendar lib files to use centralized types
  - [x] 3.11 Update imports in communications feature using `BookingView`
  - [x] 3.12 Test calendar functionality works correctly
  - [x] 3.13 Run TypeScript checks to verify no errors

- [x] 4.0 🔴 **CRITICAL**: Move Additional Calendar Service Types ✅ **COMPLETED**
  - [x] 4.1 Move remaining types from `/src/features/calendar/lib/notification-service.ts`
  - [x] 4.2 Move remaining types from `/src/features/calendar/lib/service-filter-service.ts`
  - [x] 4.3 Move remaining types from `/src/features/calendar/lib/conflict-management.ts`
  - [x] 4.4 Move remaining types from `/src/features/calendar/lib/search-performance-service.ts`
  - [x] 4.5 Organize all moved types in proper sections following calendar pattern
  - [x] 4.6 Update all import statements across calendar feature
  - [x] 4.7 Delete type exports from lib files (keep only implementation)
  - [x] 4.8 Test all calendar services and actions work correctly
  - [x] 4.9 Verify communications and other features using calendar types work

### 🟡 High Priority - Providers Feature Type Consolidation (8+ Types)

- [x] 5.0 🟡 **HIGH**: Create Providers Types Structure ✅ **COMPLETED**
  - [x] 5.1 Create `/src/features/providers/types/` directory
  - [x] 5.2 Create `/src/features/providers/types/types.ts` with calendar formatting pattern
  - [x] 5.3 Create `/src/features/providers/types/schemas.ts` with proper sections
  - [x] 5.4 Set up proper header blocks and section dividers
  - [x] 5.5 Test directory structure is accessible

- [x] 6.0 🟡 **HIGH**: Move Provider Business Types ✅ **COMPLETED**
  - [x] 6.1 Move `ProviderTypeData`, `RequirementTypeData`, `ServiceTypeData` from `/src/features/providers/lib/provider-types.ts`
  - [x] 6.2 Move all business types from `/src/features/providers/hooks/types.ts` (SupportedLanguage, RequirementValidationType, etc.)
  - [x] 6.3 Organize types into proper sections: Enums → Base Interfaces → Complex Interfaces
  - [x] 6.4 Apply consistent formatting with section headers
  - [x] 6.5 Update all imports in provider components and hooks
  - [x] 6.6 Update imports in admin feature that reference provider types
  - [x] 6.7 Delete type files from lib and hooks directories
  - [x] 6.8 Test provider functionality works correctly
  - [x] 6.9 Verify admin features using provider types still work

### 🟡 High Priority - Organizations Feature Type Consolidation (2+ Types)

- [x] 7.0 🟡 **HIGH**: Create Organizations Types Structure ✅ **COMPLETED**
  - [x] 7.1 Create `/src/features/organizations/types/` directory
  - [x] 7.2 Create `/src/features/organizations/types/types.ts` following calendar pattern
  - [x] 7.3 Create `/src/features/organizations/types/schemas.ts` for validation schemas
  - [x] 7.4 Set up proper formatting with headers and sections

- [x] 8.0 🟡 **HIGH**: Move Organizations Business Types ✅ **COMPLETED**
  - [x] 8.1 Move `OrganizationLocation` from `/src/features/organizations/hooks/use-organization-locations.ts`
  - [x] 8.2 Move `OrganizationProviderConnection` from `/src/features/organizations/hooks/use-provider-connections.ts`
  - [x] 8.3 Add types to appropriate sections in types.ts
  - [x] 8.4 Update imports in organization hooks and components
  - [x] 8.5 Update imports in calendar feature using organization types
  - [x] 8.6 Remove type exports from hook files
  - [x] 8.7 Test organization functionality works correctly

### 🟡 High Priority - Remove Barrel Exports and Consolidate Files

- [x] 9.0 🟡 **HIGH**: Remove All Index.ts Barrel Export Files ✅ **COMPLETED**
  - [x] 9.1 Identify all `/src/features/*/types/index.ts` files
  - [x] 9.2 Update imports to use direct file paths instead of barrel exports
  - [x] 9.3 Delete all index.ts files from feature type directories
  - [x] 9.4 Search codebase for any remaining barrel export imports
  - [x] 9.5 Test that all features still work without barrel exports
  - [x] 9.6 Verify build process completes successfully

- [x] 10.0 🟡 **HIGH**: Consolidate Fragmented Type Files ✅ **COMPLETED**
  - [x] 10.1 Merge `enums.ts` content into `types.ts` for admin feature
  - [x] 10.2 Merge `interfaces.ts` content into `types.ts` for admin feature
  - [x] 10.3 Repeat consolidation for profile, communications, reviews features
  - [x] 10.4 Apply consistent formatting to all consolidated files
  - [x] 10.5 Update imports to reference consolidated files
  - [x] 10.6 Delete fragmented type files after consolidation
  - [x] 10.7 Test all features work with consolidated types

### 🟡 High Priority - Apply Standardized Formatting

- [ ] 11.0 🟡 **HIGH**: Apply Calendar Formatting Pattern to All Features
  - [ ] 11.1 Update admin feature types.ts with standard formatting
  - [ ] 11.2 Update organizations feature types.ts with standard formatting  
  - [ ] 11.3 Update providers feature types.ts with standard formatting
  - [ ] 11.4 Update profile feature types.ts with standard formatting
  - [ ] 11.5 Update communications feature types.ts with standard formatting
  - [ ] 11.6 Update reviews feature types.ts with standard formatting
  - [ ] 11.7 Ensure all files have proper section headers and organization
  - [ ] 11.8 Verify consistent import organization across all files
  - [ ] 11.9 Test that formatting changes don't break functionality

### 🟡 High Priority - Create Missing Type Structures

- [ ] 12.0 🟡 **HIGH**: Complete Billing Feature Types
  - [ ] 12.1 Create `/src/features/billing/types/types.ts` with proper formatting
  - [ ] 12.2 Create `/src/features/billing/types/schemas.ts` for validation
  - [ ] 12.3 Define basic billing-related types and enums
  - [ ] 12.4 Add Prisma imports for billing-related models
  - [ ] 12.5 Test that billing types are accessible

- [ ] 13.0 🟡 **HIGH**: Create Invitations Feature Types Directory
  - [ ] 13.1 Create `/src/features/invitations/types/` directory
  - [ ] 13.2 Create `/src/features/invitations/types/types.ts` with standard formatting
  - [ ] 13.3 Create `/src/features/invitations/types/schemas.ts`
  - [ ] 13.4 Move any invitation-related types from other features
  - [ ] 13.5 Update invitation components to use centralized types

### 🔵 Medium Priority - Import Statement Updates (300+ Files)

- [ ] 14.0 🔵 **MEDIUM**: Update All Import Statements to Direct Imports
  - [ ] 14.1 Search codebase for all type imports using barrel exports
  - [ ] 14.2 Update calendar feature imports to use direct paths
  - [ ] 14.3 Update providers feature imports to use direct paths
  - [ ] 14.4 Update organizations feature imports to use direct paths
  - [ ] 14.5 Update admin feature imports to use direct paths
  - [ ] 14.6 Update remaining features imports to use direct paths
  - [ ] 14.7 Update app-level imports (pages, API routes) to use direct paths
  - [ ] 14.8 Test that all imports resolve correctly
  - [ ] 14.9 Run full build to verify no import errors

### 🔵 Medium Priority - Schema File Standardization

- [ ] 15.0 🔵 **MEDIUM**: Standardize All Schema Files
  - [ ] 15.1 Apply calendar schema formatting pattern to all features
  - [ ] 15.2 Organize schemas by Input → Response → Utility sections
  - [ ] 15.3 Add proper headers and section dividers to all schema files
  - [ ] 15.4 Ensure consistent import organization in schema files
  - [ ] 15.5 Add inferred types sections where appropriate
  - [ ] 15.6 Test that validation schemas work correctly

### 🔵 Medium Priority - Type Enhancement and Validation

- [ ] 16.0 🔵 **MEDIUM**: Create Prisma-Derived Types for Each Feature
  - [ ] 16.1 Identify Prisma model usage patterns per feature
  - [ ] 16.2 Create appropriate `Prisma.ModelGetPayload<>` types
  - [ ] 16.3 Add Prisma include configurations to each feature
  - [ ] 16.4 Replace custom interfaces with Prisma-derived types where appropriate
  - [ ] 16.5 Test that Prisma-derived types work correctly

- [ ] 17.0 🔵 **MEDIUM**: Add Type Validation Guards
  - [ ] 17.1 Create runtime type validation for critical business types
  - [ ] 17.2 Add type guards for API response validation
  - [ ] 17.3 Implement validation for user input types
  - [ ] 17.4 Add validation for external data integration points
  - [ ] 17.5 Test type validation works correctly

### 🟢 Low Priority - Documentation and Tooling

- [ ] 18.0 🟢 **LOW**: Add Comprehensive JSDoc to Complex Types
  - [ ] 18.1 Document all complex interfaces with JSDoc comments
  - [ ] 18.2 Add usage examples for service layer types
  - [ ] 18.3 Document API response types with field descriptions
  - [ ] 18.4 Add documentation for Prisma include configurations
  - [ ] 18.5 Document type relationships between features

- [ ] 19.0 🟢 **LOW**: Create Type Organization Linting Rules
  - [ ] 19.1 Create ESLint rules to enforce direct imports
  - [ ] 19.2 Add rules to prevent types in wrong directories
  - [ ] 19.3 Create rules to enforce formatting standards
  - [ ] 19.4 Add automated checks for type file organization
  - [ ] 19.5 Integrate linting rules into CI/CD pipeline

- [ ] 20.0 🟢 **LOW**: Update Documentation
  - [ ] 20.1 Update CLAUDE.md with direct import guidelines
  - [ ] 20.2 Document type organization standards
  - [ ] 20.3 Create developer guide for type definitions
  - [ ] 20.4 Add examples of proper type organization
  - [ ] 20.5 Document the calendar formatting pattern as standard

## Success Criteria

### Technical Requirements
- [ ] All 33+ misplaced types moved to correct locations
- [ ] All features follow calendar formatting pattern
- [ ] Zero barrel export files remain in features
- [ ] All import statements use direct paths
- [ ] TypeScript compilation with zero errors
- [ ] Build process completes successfully

### Quality Requirements
- [ ] Consistent formatting across all type files
- [ ] Proper section organization in all files
- [ ] Clear documentation and comments
- [ ] No circular dependencies
- [ ] Optimal tree-shaking performance

### Functional Requirements
- [ ] All features work correctly after refactoring
- [ ] No regressions in existing functionality
- [ ] Calendar functionality fully preserved
- [ ] API responses work correctly
- [ ] Form validations work correctly

## Completion Status

**Total Tasks**: 20 parent tasks (100+ sub-tasks)  
**Completed**: 0  
**In Progress**: 0  
**Remaining**: 20  

## Estimated Time

- **Critical Priority (Tasks 1-4)**: 16-20 hours
- **High Priority (Tasks 5-13)**: 24-30 hours  
- **Medium Priority (Tasks 14-17)**: 16-20 hours
- **Low Priority (Tasks 18-20)**: 8-12 hours
- **Total Estimated Time**: 64-82 hours

## Notes

- This refactoring affects 300+ files across the entire codebase
- The calendar feature serves as the gold standard for formatting
- All changes should be tested incrementally to avoid breaking functionality
- Focus on maintaining zero breaking changes to public APIs
- Prioritize critical and high priority tasks for immediate delivery value
