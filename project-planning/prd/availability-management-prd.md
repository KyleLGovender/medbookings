# Availability Management - Product Requirements Document

## Introduction/Overview

The Availability Management feature is the operational backbone that connects providers, organizations, and patients in the MedBookings platform. This feature enables organizations to schedule provider availability across locations, allows providers to manage their own calendars and respond to availability requests, and provides patients with searchable appointment slots. The system serves as the core operational tool for managing medical practice schedules while ensuring proper billing attribution and confirmation workflows.

## Goals

1. Enable organizations to operationally manage provider schedules across multiple locations
2. Provide providers with tools to manage their own availability and respond to organizational requests
3. Allow patients to search and book appointments based on real-time availability
4. Ensure proper billing attribution based on availability context (organization vs. provider-managed)
5. Support flexible service offerings with different durations and pricing during availability periods
6. Accommodate both physical location-based and online consultation availability

## User Stories

### Organization Perspective

- As an organization manager, I want to schedule availability for connected providers so that patients can book appointments with our providers
- As an organization manager, I want to ensure all working hours across locations are covered by sufficient providers
- As an organization manager, I want to use availability scheduling as a core operational function for running my organization
- As an organization manager, I want to manage availability for each location separately while supporting online bookings
- As a organization manager, I want to configure whether my appointments require manual confirmation or are automatically confirmed
- As a organization manager, I want to choose whether to display price for certain services in certain availability periods. This should be defined per service per availability period.

### Provider Perspective

- As a provider, I want to receive availability requests from organizations and decide whether to accept them
- As a provider, I want to manage my own calendar and see when and where I need to work
- As a provider, I want to set my own independent availability for services I offer directly
- As a provider, I want to configure whether my appointments require manual confirmation or are automatically confirmed
- As a provider, I want to choose whether to display price for certain services in certain availability periods. This should be defined per service per availability period.

### Patient Perspective

- As a patient, I want to see available appointment slots for organizations, locations, and providers
- As a patient, I want to search for providers based on availability (e.g., "find a GP within 20km who is available tomorrow morning between 9 and 10")
- As a patient, I want to book different types of services with clear pricing and duration information

## Functional Requirements

### Core Availability Creation

1. The system must allow creation of availability periods with start time, end time, and recurrence patterns
2. The system must support daily, weekly, monthly, and custom recurrence patterns
3. The system must generate individual availability occurrences from recurring patterns with a unique availability series ID
4. The system must allow modification of individual occurrences within a recurring series
5. The system must allow deletion or modification of entire availability series

### Service Integration

6. The system must require at least one service to be specified when creating availability
7. The system must allow multiple services to be available during a single availability period
8. The system must capture service price and duration for each service offered during availability
9. The system must allow providers to offer different service combinations (e.g., 15-min General consults for R650 and 10-min Prescription refills for R400)

### Location and Online Support

10. The system must support availability creation for specific physical locations
11. The system must support online-only availability that is not tied to any location
12. The system must prevent double-booking by ensuring a provider can only be available at one location at a time
13. The system must allow providers to be available for online consults regardless of their physical location. The provider or organization manager will specify whether online consults are an option for that availability period when generating the availability period
14. The system must support hybrid availability where providers offer both location-based and online services simultaneously

### Confirmation Workflows

15. The system must allow configuration of automatic confirmation for availability slots
16. The system must allow configuration of manual confirmation requiring provider/organization approval
17. The system must notify patients when bookings require confirmation
18. The system must provide interfaces for providers and organization managers to confirm pending bookings

### Billing Attribution

19. The system must apply organization billing models to availability scheduled under organizations
20. The system must bill provider accounts for availability scheduled independently by providers
21. The system must clearly indicate billing responsibility when creating availability

### Organization-Provider Workflow

22. The system must allow organizations to generate availability requests and send them to providers
23. The system must provide providers with interfaces to accept or decline availability requests
24. The system must track the status of availability requests (pending, accepted, declined)

### Availability Slot Management

25. The system must automatically generate bookable availability slots from created availability periods
26. The system must handle slot conflicts by marking overlapping slots as BOOKED or INVALID when one is booked
27. The system must recalculate slots when availability is modified or deleted
28. The system must allow configuration of appointment scheduling rules when creating availability:
    - **Continuous scheduling**: Appointments start immediately after the previous appointment ends
    - **Fixed interval scheduling**: Appointments start only at specified intervals (e.g., on the hour, half-hour, quarter-hour)
    - **Custom interval scheduling**: Appointments start at provider-defined intervals (e.g., every 20 minutes)
29. The system must apply the selected scheduling rule when generating bookable slots to ensure proper appointment timing

### Search and Discovery

30. The system must provide search functionality for patients to find providers by availability
31. The system must support location-based searches with distance parameters
32. The system must support time-based searches (date, time ranges)
33. The system must support service-type based searches

### Calendar Visualization

34. The system must provide calendar views for providers to visualize their availability
35. The system must provide organization-level calendar views showing multiple provider availability
36. The system must allow organizations to identify coverage gaps across required hours

## Non-Goals (Out of Scope)

- Google Calendar integration (planned for future iterations)
- Real-time calendar sync with external systems
- Automated scheduling optimization or AI-based recommendations
- Payment processing (handled by separate billing system)
- Patient communication beyond booking confirmations
- Multi-timezone support (MVP will use single timezone)

## Design Considerations

- Calendar interfaces should be intuitive and similar to common calendar applications
- Availability creation should use familiar time-picker and date-picker components
- Clear visual indicators for different availability types (organization vs. provider-managed)
- Mobile-responsive design for providers managing availability on-the-go
- Color coding for different services and confirmation requirements
- Integration with existing dashboard sidebar navigation

## Technical Considerations

- Must integrate with existing TanStack Query patterns for data fetching
- Should leverage existing provider and organization authentication systems
- Needs to work with existing location management functionality
- Must support real-time updates when availability is modified
- Should implement optimistic updates for better user experience
- Database design must support efficient querying for patient search functionality
- Utilize existing types directory structure for strongly-typed interfaces
- All code must be strongly typed based on the Prisma schema

## Success Metrics

- Organizations can schedule full weekly provider coverage in under 30 minutes
- Providers can set up recurring availability patterns in under 5 minutes
- Patient search results return relevant availability within 2 seconds
- 95% of availability modifications are successfully saved and reflected immediately
- Zero double-booking incidents due to slot conflict management

### Additional Requirements Based on Clarifications

37. The system must not impose limits on how far in advance availability can be scheduled
38. The system must prevent deletion or modification of availability that has existing bookings
39. The system must require organization managers to handle holiday periods and organizational closures by manually deleting specific recurring availability occurrences
40. The system must log all availability request communications for audit purposes
41. The system must ensure that organization-level availability is always initiated by organizations and requires provider acceptance
