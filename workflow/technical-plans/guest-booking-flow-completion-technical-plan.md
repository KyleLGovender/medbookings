# Technical Plan: Guest Booking Flow Completion

## Type: Feature

## Executive Summary

Complete the guest booking system by connecting the existing landing page search component to the calendar booking system, and implementing comprehensive booking confirmations via SendGrid email and Twilio WhatsApp. The core infrastructure exists but lacks integration between components and proper notification workflows.

## Scope Definition

### What We're Building

- Provider search integration from landing page to calendar system
- Complete booking confirmation workflow with email and WhatsApp notifications
- Slot state management for AVAILABLE → BOOKED transitions
- Guest booking form validation and data persistence

### What We're NOT Building

- New authentication systems (guest bookings remain unauthenticated)
- Payment processing integration (existing price display only)
- Advanced search filtering beyond location/service type
- Provider management interfaces (existing admin system handles this)

## Technical Architecture

### Files to Modify

/src/components/landing-booking-query.tsx - Add navigation to provider search results
/src/server/api/routers/calendar.ts - Enhance createPublicBooking with notifications
/src/features/communications/lib/server-helper.ts - Complete email integration
/src/lib/communications/email.ts - Implement SendGrid email sending
/src/features/calendar/hooks/use-create-booking.ts - Add success callback handling

### Files to Create

/src/app/(general)/providers/page.tsx - Provider search results page
/src/features/calendar/components/provider-search-results.tsx - Search results display
/src/features/calendar/lib/provider-search.ts - Search logic and filtering
/src/features/communications/lib/email-templates.ts - Email template definitions

### Database Changes

- No schema modifications required
- Existing Booking model supports guest bookings with isGuestBooking flags
- Slot status transitions use existing CalculatedAvailabilitySlot.status field

## Implementation Details

### Core Functions

```typescript
// Function: searchProvidersWithSlots
// Purpose: Search providers based on service type, location, and availability within date range
// Location: /src/features/calendar/lib/provider-search.ts
searchProvidersWithSlots(filters: ProviderSearchFilters): Promise<ProviderWithSlots[]>

// Function: navigateToProviderBooking
// Purpose: Route user from search results to provider calendar with pre-selected filters
// Location: /src/components/landing-booking-query.tsx
navigateToProviderBooking(providerId: string, serviceId?: string): void

// Function: sendGuestBookingConfirmations
// Purpose: Send email and WhatsApp confirmations to guest and provider after booking
// Location: /src/features/communications/lib/server-helper.ts
sendGuestBookingConfirmations(booking: BookingWithDetails): Promise<void>

// Function: updateSlotStatusToBooked
// Purpose: Transition slot from AVAILABLE to BOOKED and handle concurrent booking prevention
// Location: /src/server/api/routers/calendar.ts
updateSlotStatusToBooked(slotId: string, bookingId: string): Promise<void>
```

### API Endpoints (if applicable)

```typescript
// tRPC Procedure: searchProvidersByLocation
// Purpose: Search providers with available slots in specified location and service type
// Input: { serviceType: string, location: string, consultationType: 'online' | 'in-person' }
// Output: ProviderWithSlots[]

// tRPC Procedure: createPublicBooking (enhanced)
// Purpose: Create guest booking with comprehensive notification workflow
// Input: BookingFormData with slot validation
// Output: { success: boolean, bookingId: string, confirmationsSent: boolean }
```

### Component Structure (if applicable)

```typescript
// Component: ProviderSearchResults
// Purpose: Display provider search results with booking call-to-action buttons
// Props: { providers: ProviderWithSlots[], onProviderSelect: (id: string) => void }

// Component: BookingConfirmationToast (enhanced)
// Purpose: Show booking success with confirmation details and next steps
// Props: { booking: BookingDetails, onClose: () => void }
```

## Test Coverage Strategy

### Unit Tests

- should search providers by location and service type - location filtering accuracy
- handles empty search results gracefully - edge case management
- validates guest booking form data correctly - input sanitization checks
- sends email confirmation via SendGrid successfully - email delivery verification
- sends WhatsApp confirmation via Twilio successfully - WhatsApp delivery verification
- prevents double booking of same slot - concurrency protection
- updates slot status after booking creation - state transition correctness

### Integration Tests

- API: searchProvidersByLocation returns filtered results - provider search accuracy
- API: createPublicBooking sends confirmations correctly - end-to-end booking flow
- Database: slot status transitions persist correctly - state management verification

### E2E Tests

- User can complete booking from landing page to confirmation - complete user journey
- Guest receives email and WhatsApp confirmations after booking - notification delivery
- Provider receives booking notification with guest details - provider workflow

## Implementation Sequence

1. Phase 1: Provider Search Integration

- Implement provider search API endpoint with location/service filtering
- Create provider search results page and component
- Connect landing page form to search results navigation
- Test: Search functionality works from landing page

2. Phase 2: Booking Confirmation Enhancement

- Implement SendGrid email template system
- Enhance Twilio WhatsApp notification workflow
- Update createPublicBooking to trigger confirmations
- Test: Booking confirmations sent via both channels

3. Phase 3: Slot State Management

- Add slot status validation in booking creation
- Implement concurrent booking prevention
- Update booking success handling with proper state transitions
- Test: Slot states transition correctly under load

## Risk Assessment

- Technical Risk: SendGrid/Twilio API rate limits during high booking volume
- Performance Impact: Additional provider search queries may impact homepage load time
- Breaking Changes: None - all changes are additive to existing booking system

## Code Quality Requirements
[ ] No legacy fallback code
[ ] Minimal implementation only
[ ] Each code block must pass linting
[ ] Each code block must compile
[ ] Tests written before next code block
[ ] No backwards compatibility unless requested

## Implementation Instructions

When implementing this plan, use the following directive:

For FEATURES:
"Now think hard and write elegant code that implements and achieves the feature: guest-booking-flow-completion.
Do not add backwards compatibility unless explicitly requested.
After every code block you write, lint, compile, and write corresponding tests and run them before writing the next code block."