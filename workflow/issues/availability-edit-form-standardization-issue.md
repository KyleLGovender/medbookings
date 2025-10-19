# Availability Edit Form Standardization Issue

## Issue Summary

The availability-edit-form.tsx component needs to be completely rebuilt from scratch to follow the comprehensive pattern established in availability-creation-form.tsx. The existing implementation has been removed and requires a complete rebuild that mirrors the creation form's structure while adapting appropriately for edit mode functionality.

## Problem Description

The availability-edit-form.tsx file currently contains no implementation and needs to be built from the ground up following the availability-creation-form.tsx pattern. This is a greenfield implementation that must:

### Required Implementation Sections

- **Complete form structure** - Rebuild following creation form's comprehensive layout
- **Edit mode adaptations** - Adapt creation form patterns for editing existing availability
- **Profile context display** - Show provider/creator information in read-only format
- **Time settings with constraints** - Handle existing booking restrictions appropriately
- **Comprehensive recurrence settings** - Include custom recurrence modal support for edit scenarios
- **Service selection integration** - Match creation form's service selection functionality
- **Proper form organization** - Use consistent separators, section headings, and structured layout
- **Loading and error states** - Implement CalendarLoader and comprehensive error handling
- **Form validation** - Use identical validation rules and schemas as creation form

## Expected vs Actual Behavior

### Expected Behavior

The edit form should be a comprehensive rebuild that:

- Mirrors the creation form's complete structure and user experience
- Provides edit-specific adaptations (read-only fields, booking constraints)
- Supports all creation form features adapted for edit mode
- Uses identical validation, error handling, and UI patterns
- Maintains consistency across the availability management system

### Actual Behavior

The edit form is currently empty and needs complete implementation from scratch.

## Reproduction Steps

1. Navigate to availability-creation-form.tsx - observe comprehensive structure and functionality
2. Attempt to edit existing availability - edit form is currently non-functional
3. Review the creation form sections that need to be implemented in edit mode

## Affected Users/Scope

**Primary Impact:** Providers who need to edit their existing availability
**Secondary Impact:** Developers maintaining the availability system

**Frequency:** Every time a provider attempts to edit existing availability
**Business Impact:** Core functionality is completely missing, blocking user workflows

## Root Cause Analysis

The edit form implementation was removed to enable a clean rebuild following the established patterns in the creation form. This is an intentional technical debt resolution requiring a complete greenfield implementation.

## Potential Solutions

**Required Solution: Complete Rebuild Following Creation Form Pattern**

1. **Use availability-creation-form.tsx as the exact reference implementation**
2. **Copy the complete structure and adapt for edit mode:**
   - Profile section becomes read-only context display (creator type, provider selection)
   - Time settings respect existing bookings constraints (disable when bookings exist)
   - Recurrence editing with series update options (single/series/future)
   - Location management (online-only for provider-created availability)
   - Service selection matching creation form functionality
   - Additional settings identical to creation form
3. **Maintain identical patterns:** validation rules, error handling, component usage, styling
4. **Implement proper data loading:** fetch existing availability data and populate form
5. **Use update mutation:** integrate with useUpdateAvailability hook

## Implementation Requirements

### Core Architecture

- **Follow CLAUDE.md patterns exactly** - tRPC types, zero type drift, proper separation
- **Provider-only availability** - This form is only for provider-created (online-only) availability
- **Use updateAvailabilityDataSchema** - For form validation (must match creation form validation)
- **RouterInputs/RouterOutputs** - Use tRPC types for zero type drift
- **Use availability-creation-form.tsx as template** - Copy structure exactly

### Key Edit Mode Adaptations

- **Load existing data** - Use useAvailabilityById to fetch current availability
- **Profile section read-only** - Show creator and provider information contextually
- **Booking constraints** - Disable time/date changes when bookings exist
- **Recurrence handling** - Support editing recurring series with scope options
- **Form population** - Pre-populate all fields from existing availability data
- **Update mutation** - Use useUpdateAvailability instead of useCreateAvailability

## Definition of Done

### Core Structure Implementation

- [ ] Complete form structure copied from availability-creation-form.tsx
- [ ] All sections present: context header, time settings, recurrence, scheduling rules, location, services, additional settings
- [ ] Proper form organization with consistent separators and section headings
- [ ] Uses CalendarLoader component for loading states
- [ ] Comprehensive error handling matching creation form exactly
- [ ] Identical validation rules using updateAvailabilityDataSchema

### Edit Mode Functionality

- [ ] Loads existing availability data using useAvailabilityById
- [ ] Pre-populates all form fields from existing data
- [ ] Profile section shows read-only context (creator type, provider info)
- [ ] Time/date changes respect existing booking constraints (disabled when bookings exist)
- [ ] Recurrence editing supports series update options
- [ ] Service selection pre-populated and fully functional
- [ ] Form submission uses useUpdateAvailability mutation

### Technical Compliance

- [ ] Follows all CLAUDE.md patterns exactly
- [ ] Zero type drift with tRPC RouterInputs/RouterOutputs patterns
- [ ] Uses same hooks and state management as creation form
- [ ] Provider-only availability constraints (online-only, no organization)
- [ ] Proper accessibility and responsive design
- [ ] ESLint/Prettier compliant code

### User Experience

- [ ] Clear indicators for read-only vs editable fields
- [ ] Proper feedback for booking constraints (disabled states, warning messages)
- [ ] Loading states during data fetch and form submission
- [ ] Error handling and user feedback matching creation form
- [ ] Success handling and navigation after update

### Testing Requirements

- [ ] Form loads correctly with existing availability data
- [ ] All form sections populate and function correctly
- [ ] Booking constraint restrictions work properly
- [ ] Recurrence editing works for single and series updates
- [ ] Service selection and validation work correctly
- [ ] Form submission and error handling work properly

## Implementation Strategy

### Phase 1: Structure Setup (1-2 hours)

- Copy complete structure from availability-creation-form.tsx
- Set up proper imports and TypeScript types
- Implement data loading with useAvailabilityById
- Set up form with updateAvailabilityDataSchema

### Phase 2: Form Population (1-2 hours)

- Implement form population from existing availability data
- Handle all data transformations for form fields
- Set up read-only profile context section

### Phase 3: Edit Mode Adaptations (2-3 hours)

- Implement booking constraint checking and UI restrictions
- Add recurrence editing with series update support
- Adapt service selection for edit mode
- Handle location constraints (online-only for providers)

### Phase 4: Integration and Polish (1-2 hours)

- Integrate with useUpdateAvailability mutation
- Implement comprehensive error handling
- Add loading states and user feedback
- Test all functionality thoroughly

## Estimated Time

**Total: 6-8 hours**

- Structure setup and data loading: 2-3 hours
- Edit mode adaptations and constraints: 2-3 hours
- Integration, polish, and testing: 2 hours

## Priority

**Critical** - Core functionality is completely missing, blocking essential user workflows for availability management.
