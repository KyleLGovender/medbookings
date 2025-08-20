# Provider Appointment Booking View - Product Requirements Document

## Introduction/Overview

The Provider Appointment Booking View is a calendar-based interface that allows users (patients) and organization managers to view and select available appointment slots with healthcare providers. This view serves as the primary discovery and selection interface for booking appointments, displaying real-time availability in an intuitive calendar format that adapts to different device sizes.

## Goals

1. Enable users to easily discover available appointment slots based on their preferences
2. Provide an intuitive calendar interface for viewing provider availability
3. Support efficient filtering and searching of available slots by multiple criteria
4. Ensure real-time accuracy of slot availability to prevent double-booking
5. Offer responsive design with optimized views for both mobile and desktop users

## User Stories

1. **As a patient**, I want to view available appointment slots on a calendar so that I can find a convenient time for my appointment.

2. **As a patient**, I want to filter available slots by date, time, location, provider type, service, duration, and price so that I can find appointments that meet my specific needs.

3. **As an organization manager**, I want to view provider availability on behalf of patients so that I can help them book appointments.

4. **As a mobile user**, I want to see a day or 3-day calendar view so that I can easily navigate availability on my device.

5. **As a desktop user**, I want to see day, 3-day, or week views so that I can see more availability options at once.

6. **As a user**, I want to see real-time availability updates so that I don't try to book slots that have already been taken.

## Functional Requirements

1. **Calendar Display**
   - The system must display available slots as green, clickable entities on a calendar grid
   - The system must display unavailable slots as greyed out and non-clickable
   - The system must show time and derive duration from the visual position/size of the slot button
   - The system must display duration text on each slot
   - The system must use color coding to indicate slot status (green for available, grey for unavailable)

2. **View Options**
   - The system must provide day view on mobile devices
   - The system must provide 3-day view option on mobile devices
   - The system must provide day, 3-day, and week views on desktop devices
   - The system must maintain the same navigation pattern as the existing provider-calendar-view component

3. **Search and Filter Capabilities**
   - The system must allow filtering by:
     - Date
     - Time
     - Location or online
     - Provider type
     - Service
     - Duration
     - Price
   - The system must update the calendar in real-time as filters are applied
   - The system must persist filter selections when users navigate between date ranges
   - The system must provide a "clear all filters" option

4. **Provider Selection**
   - The system must allow users to select one provider at a time
   - The system must not display multiple providers' availability simultaneously

5. **Calendar Navigation**
   - The system must use the same navigation controls as the existing provider-calendar-view
   - The system must default to showing today's date when first loaded
   - The system must automatically hide past time slots for the current day

6. **Data Integration**
   - The system must pull availability data from the existing CalculatedAvailabilitySlot table
   - The system must show real-time availability accounting for bookings made by other users
   - The system must integrate with the existing provider availability management system

7. **Slot Interaction**
   - The system must allow users to click on available (green) slots
   - The system must trigger a booking form when a slot is clicked (form implementation out of scope for this PRD)

8. **Performance**
   - The system must efficiently handle displaying up to 40 slots per day (e.g., GP working 8am-6pm with 4 slots per hour)
   - The system must implement an effective UI solution for displaying many slots without overwhelming the user

9. **Booking Constraints**
   - The system must prevent double-booking of slots
   - The system must enforce a maximum advance booking time of 3 days
   - The system must not enforce a minimum advance booking time

10. **Access Control**
    - The system must be accessible to non-logged-in users (public view)
    - The system must display all available slots to all user types without restrictions

## Non-Goals (Out of Scope)

1. Booking form implementation and data collection
2. Booking confirmation flow
3. Payment processing
4. Guest vs registered user differentiation
5. External calendar synchronization (Google Calendar)
6. Ability to save/favorite specific slots
7. Slot sharing functionality
8. Provider detail views within the booking interface
9. Group bookings or recurring appointments
10. Comparison view across multiple providers
11. Provider-specific information display on slot cards

## Design Considerations

- **Responsive Design**: The interface must adapt seamlessly between mobile (day/3-day views) and desktop (day/3-day/week views)
- **Visual Hierarchy**: Clear distinction between available (green) and unavailable (grey) slots
- **Calendar Grid**: Maintain consistency with existing provider-calendar-view component for familiar user experience
- **Slot Visualization**: Time and duration should be intuitively understood from slot positioning and size on the calendar
- **Filter Bar**: Prominent and accessible filter controls that don't obstruct the calendar view
- **Dense Information Display**: Creative solution needed for displaying up to 40 slots per day without overwhelming users (consider grouping, collapsing, or smart layout algorithms)

## Technical Considerations

1. **Route Location**: Implementation should be under `/app/(general)/calendar` for public access
2. **Database Integration**: Direct integration with CalculatedAvailabilitySlot table using existing tRPC procedures
3. **Real-time Updates**: Implement optimistic updates or polling to ensure slot availability is current
4. **Component Reuse**: Leverage existing provider-calendar-view navigation and layout patterns
5. **Performance Optimization**: Consider virtual scrolling or lazy loading for days with many slots
6. **State Management**: Maintain filter state across navigation and date changes
7. **Type Safety**: Use existing RouterOutputs type patterns for availability slot data

## Success Metrics

1. **User Engagement**: 80% of users successfully find and click on an available slot within 2 minutes
2. **Filter Usage**: 60% of users utilize at least one filter during their session
3. **Booking Initiation Rate**: 70% of users who click on a slot proceed to the booking form
4. **Performance**: Calendar loads and displays slots within 2 seconds
5. **Error Reduction**: Zero double-booking incidents due to UI race conditions
6. **Mobile Adoption**: 40% of bookings initiated from mobile devices

## Open Questions

1. **Slot Density Display**: Implementation detail to be determined during development - start with basic slot display on calendar

2. **Caching Strategy**: To be determined based on performance requirements during implementation

3. **Analytics**: Specific tracking requirements to be defined in future iteration

## Implementation Notes

1. **Filter Priority Order** (from highest to lowest priority):
   - Date
   - Time
   - Location or online
   - Provider type
   - Service
   - Duration
   - Price

2. **Loading States**: Use existing `calendar-loader.tsx` component for consistency

3. **Empty State**: Display an empty calendar grid with no slots when filters yield no results

4. **Time Zone**: System designed for South Africa only - single time zone support (SAST/UTC+2)