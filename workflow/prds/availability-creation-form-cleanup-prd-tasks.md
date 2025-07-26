# Availability Creation Form Technical Debt Cleanup - Implementation Tasks

Based on the **Availability Creation Form Technical Debt Cleanup PRD**, this document outlines the complete implementation tasks for refactoring the availability creation form into a clean reference pattern.

## Relevant Files

- `src/features/calendar/components/availability/availability-creation-form.tsx` - The main component requiring cleanup and refactoring
- `src/features/calendar/types/types.ts` - Type definitions to be used for proper typing
- `src/features/calendar/types/schemas.ts` - Zod schemas for form validation
- `src/features/calendar/hooks/use-availability.ts` - Hook for availability data management
- `src/features/calendar/lib/actions.ts` - Server actions for availability creation
- `src/app/(dashboard)/calendar/availability/page.tsx` - Page using the availability creation form
- `src/app/(dashboard)/organizations/[id]/manage-calendar/page.tsx` - Organization page using the form
- `src/features/calendar/components/availability/custom-recurrence-modal.tsx` - Related component for recurrence
- `src/features/calendar/components/availability/service-selection-section.tsx` - Related service selection component

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- Follow CLAUDE.md patterns for form handling, state management, and data access
- Maintain all existing functionality without user-facing changes

## Tasks

- [ ] 1.0 **Code Cleanup and Dead Code Removal**
  - [ ] 1.1 Review entire component for unused variables and remove them
  - [ ] 1.2 Remove all commented-out code blocks
  - [ ] 1.3 Remove any console.log statements or debugging artifacts
  - [ ] 1.4 Clean up unused imports
  - [ ] 1.5 Address TODO comment at line 237 (organization provider selection)
  - [ ] 1.6 Identify and remove any development-only code

- [ ] 2.0 **Type Safety Improvements**
  - [ ] 2.1 Replace `any` type at line 99 with proper TypeScript type
  - [ ] 2.2 Replace `any` types at lines 486-487 with proper types
  - [ ] 2.3 Import and use proper types from `/features/calendar/types/types.ts`
  - [ ] 2.4 Add proper typing to all function parameters and return types
  - [ ] 2.5 Implement type guards where appropriate for runtime type checking
  - [ ] 2.6 Ensure all form data types align with Zod schemas

- [ ] 3.0 **CLAUDE.md Pattern Implementation**
  - [ ] 3.1 Ensure React Hook Form is properly integrated with Zod schemas
  - [ ] 3.2 Implement `z.record()` for nested data structures instead of arrays
  - [ ] 3.3 Apply Controller pattern for complex form controls
  - [ ] 3.4 Implement proper error handling with FormData → mutateAsync → UI feedback pattern
  - [ ] 3.5 Ensure TanStack Query is used for all server state management
  - [ ] 3.6 Verify Hook → API Route → Server Action → Prisma data flow
  - [ ] 3.7 Remove any mock data and implement proper loading/error states

- [ ] 4.0 **Component Structure Refactoring**
  - [ ] 4.1 Reorganize imports following order: React/Next.js → third-party → internal → relative
  - [ ] 4.2 Group related logic together (form setup, handlers, effects)
  - [ ] 4.3 Extract reusable functions to reduce component complexity
  - [ ] 4.4 Ensure consistent naming conventions throughout
  - [ ] 4.5 Add proper JSDoc comments for complex logic
  - [ ] 4.6 Organize form field components in logical sections
  - [ ] 4.7 Ensure proper separation between UI logic and business logic

- [ ] 5.0 **Performance and Optimization Review**
  - [ ] 5.1 Review and optimize React Hook Form watch usage
  - [ ] 5.2 Identify and fix unnecessary re-renders
  - [ ] 5.3 Optimize form field dependencies
  - [ ] 5.4 Ensure efficient use of useEffect hooks
  - [ ] 5.5 Review and optimize any expensive computations
  - [ ] 5.6 Implement proper memoization where beneficial

- [ ] 6.0 **Validation and Testing**
  - [ ] 6.1 Verify provider availability creation works correctly
  - [ ] 6.2 Test organization availability proposal functionality
  - [ ] 6.3 Confirm custom recurrence patterns work as expected
  - [ ] 6.4 Validate service selection with pricing functionality
  - [ ] 6.5 Test location selection for organization mode
  - [ ] 6.6 Ensure form validation shows proper error messages
  - [ ] 6.7 Verify TypeScript compilation with no warnings
  - [ ] 6.8 Check for console errors during runtime
  - [ ] 6.9 Test profile selection for both provider and organization modes