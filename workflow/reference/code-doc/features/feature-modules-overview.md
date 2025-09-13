# Feature Modules Overview

## Introduction

MedBookings uses a **feature-driven architecture** where each major business capability is organized into its own module. This document provides comprehensive documentation of all feature modules in the system.

## Architecture Philosophy

### Feature-First Organization

Instead of organizing by technical layers (components/, services/, utils/), MedBookings organizes by business features:

```
src/features/
├── admin/           # Admin management and approvals
├── auth/            # Authentication and user management  
├── billing/         # Payment processing and subscriptions
├── calendar/        # Booking and availability management
├── communications/  # Email, SMS, WhatsApp notifications
├── invitations/     # User and provider invitations
├── organizations/   # Healthcare organizations
├── profile/         # User profile management
├── providers/       # Healthcare providers
└── reviews/         # Rating and review system
```

### Standard Feature Structure

Every feature follows the same organizational pattern:

```
features/[feature]/
├── components/      # UI components specific to this feature
├── hooks/          # tRPC hooks and custom React hooks
├── lib/            # Server actions and utility functions
└── types/          # Type definitions, schemas, and guards
    ├── types.ts        # Domain types and enums
    ├── schemas.ts      # Zod validation schemas
    └── guards.ts       # Type guard functions
```

### Key Principles

1. **Domain Isolation**: Each feature contains its complete business logic
2. **API Centralization**: All database operations in tRPC routers
3. **Type Safety**: Comprehensive TypeScript coverage with Zod schemas
4. **Server-First**: Server actions for business logic, tRPC for data

## Core Feature Modules

## 1. Admin Module (`/admin`)

**Purpose**: System administration, approvals, and oversight

### Responsibilities
- Provider approval workflows
- Organization approval processes
- Requirement validation
- Dashboard statistics
- Admin override capabilities
- Audit logging

### Key Components
- **Admin Dashboard**: Platform-wide statistics and alerts
- **Provider Review**: Complete provider approval workflow
- **Organization Review**: Organization approval and management
- **Requirement Inspector**: Individual requirement approval/rejection

### API Endpoints (`adminRouter`)
```typescript
// Dashboard & Statistics
getDashboardStats()              // Platform metrics
getPendingProviders()            // Providers awaiting approval
getPendingOrganizations()        // Organizations awaiting approval

// Provider Management
getProviders(filters)            // All providers with search/filter
getProviderById(id)              // Individual provider details
getProviderRequirements(id)      // Provider's requirement submissions
approveProvider(id)              // Approve provider (with validation)
rejectProvider(id, reason)       // Reject provider with reason
resetProviderStatus(id)          // Reset rejected to pending

// Organization Management
getOrganizations(filters)        // All organizations with search/filter
getOrganizationById(id)          // Individual organization details
approveOrganization(id)          // Approve organization
rejectOrganization(id, reason)   // Reject organization with reason
resetOrganizationStatus(id)      // Reset rejected to pending

// Requirement Management
approveRequirement(providerId, requirementId)  // Approve individual requirement
rejectRequirement(providerId, requirementId, reason)  // Reject individual requirement

// Utilities
overrideLogin(userId)            // Admin impersonation for debugging
```

### Business Rules
- **Provider Approval**: All required requirements must be approved first
- **Audit Trail**: All admin actions logged with context
- **Permission Levels**: ADMIN and SUPER_ADMIN roles only
- **Reason Required**: All rejections must include detailed reasons

### Type System
```typescript
// Schemas (/admin/types/schemas.ts)
adminSearchParamsSchema          // Search and filter parameters
approveProviderRequestSchema     // Provider approval validation
rejectProviderRequestSchema      // Provider rejection with reason
approveOrganizationRequestSchema // Organization approval validation
rejectOrganizationRequestSchema  // Organization rejection with reason
```

## 2. Organizations Module (`/organizations`)

**Purpose**: Healthcare organization management and member coordination

### Responsibilities
- Organization registration and setup
- Location management
- Member invitations and role management
- Provider connection management
- Billing model configuration

### Key Components
- **Organization Setup Wizard**: Multi-step registration process
- **Location Manager**: Geographic location setup and management
- **Member Management**: User roles, invitations, permissions
- **Provider Connections**: Provider-organization relationships
- **Organization Dashboard**: Organization-specific analytics

### API Endpoints (`organizationsRouter`)
```typescript
// Core CRUD
create(orgData)                  // Register new organization
getById(id)                      // Organization details with members/locations
update(id, data)                 // Update organization info
delete(id)                       // Delete organization
getByUserId(userId)              // User's organizations

// Location Management
getLocations(organizationId)     // Organization's locations
createLocation(orgId, location)  // Add new location
updateLocations(orgId, locations) // Batch update all locations

// Provider Connections
getProviderConnections(orgId)    // Connected providers
updateProviderConnection(orgId, connectionId, status)  // Accept/suspend provider
deleteProviderConnection(orgId, connectionId)          // Remove provider

// Provider Invitations
getProviderInvitations(orgId)    // Sent provider invitations
createProviderInvitation(orgId, email, message)       // Invite provider
cancelProviderInvitation(orgId, invitationId)         // Cancel invitation
resendProviderInvitation(orgId, invitationId)         // Resend invitation

// Member Management
getMembers(orgId)                // Organization members
getMemberInvitations(orgId)      // Pending member invitations
inviteMember(orgId, email, role) // Invite organization member
acceptInvitation(token)          // Accept member invitation
rejectInvitation(token)          // Reject member invitation
changeMemberRole(orgId, memberId, newRole)      // Change member role
removeMember(orgId, memberId)    // Remove member
cancelMemberInvitation(orgId, invitationId)     // Cancel member invitation
```

### Key Features

#### Multi-Location Support
Organizations can have multiple physical locations:
```typescript
interface Location {
  name: string;
  formattedAddress: string;
  googlePlaceId?: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  email?: string;
}
```

#### Role-Based Access Control
```typescript
enum OrganizationRole {
  OWNER = 'OWNER',      // Full control
  ADMIN = 'ADMIN',      // Management permissions
  MEMBER = 'MEMBER'     // Basic access
}
```

#### Provider Connection Management
- Providers can be connected to organizations
- Connection statuses: PENDING, ACCEPTED, SUSPENDED
- Providers can work at organization locations
- Billing handled per organization or per location

#### Billing Models
```typescript
enum OrganizationBillingModel {
  CONSOLIDATED = 'CONSOLIDATED',  // Single bill for entire organization
  PER_LOCATION = 'PER_LOCATION'   // Separate billing per location
}
```

### Business Rules
- **Ownership Transfer**: Must have at least one OWNER
- **Location Validation**: Google Places API integration for address validation
- **Provider Relations**: Providers must be approved before connection
- **Member Invitations**: Email-based with 7-day expiry
- **Permission Hierarchy**: OWNER > ADMIN > MEMBER

## 3. Providers Module (`/providers`)

**Purpose**: Healthcare provider management and professional profiles

### Responsibilities
- Provider registration and onboarding
- Professional requirement submission and validation
- Service offerings management
- Provider-organization connections
- Availability configuration

### Key Components
- **Provider Onboarding**: Multi-step registration with requirements
- **Profile Management**: Professional information and credentials
- **Services Configuration**: Service offerings and pricing
- **Requirements Dashboard**: Regulatory compliance tracking
- **Connection Manager**: Organization relationship management

### API Endpoints (`providersRouter`)
```typescript
// Identity & Basic Queries
getCurrentProvider()             // Current user's provider profile
getById(id)                      // Provider details
getByUserId(userId)              // Provider by user ID
search(params)                   // Search providers with filters

// Onboarding & Profile
create(data)                     // Register new provider
update(id, data)                 // Update provider profile
updateBasicInfo(id, info)        // Update basic information
updateServices(id, services)     // Update service offerings
updateRequirements(id, requirements) // Update regulatory requirements

// Organization Connections
getConnections()                 // Provider's organization connections
requestConnection(orgId)         // Request to join organization
respondToInvitation(inviteId, response) // Accept/decline org invitation
updateConnection(connectionId, status)   // Update connection status

// Availability Configuration
getAvailabilityConfigs()         // Provider's availability configs
createAvailabilityConfig(config) // Create new availability config
updateAvailabilityConfig(id, config)     // Update availability config
deleteAvailabilityConfig(id)     // Delete availability config

// Requirements Management
getRequirements()                // Provider's requirement submissions
submitRequirement(requirementData) // Submit requirement for approval
updateRequirement(id, data)      // Update requirement submission
deleteRequirement(id)            // Delete requirement submission
```

### Provider Types & Services

#### Provider Types
Providers are categorized by their professional specialty:
- **Medical Doctors**: Various specialties (GP, Cardiologist, etc.)
- **Allied Health**: Physiotherapists, Occupational Therapists, etc.
- **Mental Health**: Psychologists, Counselors, etc.
- **Specialists**: Surgeons, Radiologists, etc.

Each provider type has:
- Required qualifications and certifications
- Specific regulatory requirements
- Associated service offerings
- Different approval processes

#### Service Management
```typescript
interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;      // Minutes
  price?: number;        // Optional pricing
  isActive: boolean;
  providerTypeId: string;
}
```

### Regulatory Requirements System

#### Requirement Types
- **Identity Verification**: Government ID, proof of identity
- **Professional Registration**: Medical board registration
- **Qualifications**: Degrees, certificates, continuing education
- **Insurance**: Professional indemnity, public liability
- **Background Checks**: Police clearance, working with children checks

#### Requirement Validation Flow
```
Provider Submits → Admin Reviews → Approved/Rejected → Provider Active/Inactive
```

#### Submission Structure
```typescript
interface RequirementSubmission {
  requirementTypeId: string;
  providerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  submittedAt: Date;
  validatedAt?: Date;
  validatedById?: string;
}
```

### Business Rules
- **Approval Required**: Providers must be approved before accepting bookings
- **All Requirements**: All required regulatory requirements must be approved
- **Connection Limits**: Providers can connect to multiple organizations
- **Service Restrictions**: Services must match provider type capabilities
- **Status Flow**: PENDING_APPROVAL → APPROVED → ACTIVE

## 4. Calendar Module (`/calendar`)

**Purpose**: Appointment scheduling, availability management, and booking coordination

### Responsibilities
- Provider availability creation and management
- Slot generation and optimization
- Booking creation and management
- Calendar integration (Google Calendar)
- Conflict detection and resolution

### Key Components
- **Availability Creator**: Flexible availability scheduling system
- **Slot Manager**: Automated slot generation from availability
- **Booking Interface**: Appointment booking and management
- **Calendar Sync**: Google Calendar bidirectional sync
- **Conflict Resolver**: Automatic conflict detection

### API Endpoints (`calendarRouter`)
```typescript
// Reference Data
getServiceTypes()                // Available services for booking

// Availability CRUD
getById(id)                      // Availability details with slots
create(data)                     // Create new availability
update(id, data)                 // Update availability
delete(id)                       // Delete availability (with validations)

// Availability Queries
getByProvider(providerId, params) // Provider's availability
getByOrganization(orgId, params) // Organization's availability
getByLocation(locationId, params) // Location-specific availability
search(params)                   // Search availability with filters

// Slot Management
getSlots(availabilityId)         // Generated slots for availability
generateSlots(availabilityId)    // Regenerate slots (admin)
getAvailableSlots(params)        // Public slot availability

// Booking Management
createBooking(slotId, data)      // Book an appointment
updateBooking(bookingId, data)   // Update booking details
cancelBooking(bookingId, reason) // Cancel booking
confirmBooking(bookingId)        // Provider confirms booking

// Calendar Integration
syncGoogleCalendar(providerId)   // Sync with Google Calendar
importCalendarEvents(providerId) // Import external events
exportCalendarData(params)       // Export booking data
```

### Availability System

#### Availability Types
1. **Regular Availability**: Recurring weekly patterns
2. **One-time Availability**: Special availability for specific dates
3. **Exception Availability**: Overrides for regular patterns

#### Availability Configuration
```typescript
interface Availability {
  providerId: string;
  organizationId?: string;        // Optional organization association
  locationId?: string;           // Optional location restriction
  serviceIds: string[];          // Services offered during this availability
  startTime: Date;
  endTime: Date;
  schedulingRule: SchedulingRule; // RECURRING, ONE_TIME, EXCEPTION
  recurringPattern?: RecurringPattern;
  status: AvailabilityStatus;    // ACTIVE, INACTIVE, CANCELLED
}
```

#### Recurring Patterns
```typescript
interface RecurringPattern {
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  daysOfWeek: number[];          // 0=Sunday, 1=Monday, etc.
  endDate?: Date;                // When recurrence ends
  exceptions: Date[];            // Dates to skip
}
```

### Slot Generation System

#### Automatic Slot Creation
The system automatically generates bookable slots from availability:
- **Duration-based**: Slots created based on service duration
- **Buffer Time**: Optional buffer between appointments
- **Break Times**: Lunch breaks, administrative time
- **Conflict Detection**: Prevents overlapping bookings

#### Slot Status Flow
```
AVAILABLE → BOOKED → CONFIRMED → COMPLETED
         ↳ BLOCKED (by external calendar)
         ↳ CANCELLED
```

### Booking System

#### Booking Types
1. **Self-Service**: Patients book directly online
2. **Staff-Assisted**: Organization staff creates bookings
3. **Provider-Created**: Provider creates bookings directly

#### Booking Information
```typescript
interface Booking {
  slotId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
  status: BookingStatus;
  createdById?: string;          // Who created the booking
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}
```

#### Confirmation Flow
- **Immediate**: Auto-confirmed for certain provider types
- **Manual**: Provider must confirm booking
- **Organization**: Organization staff confirms

### Google Calendar Integration

#### Bidirectional Sync
- **Import**: External events block available slots
- **Export**: MedBookings appointments appear in Google Calendar
- **Conflict Detection**: Prevents double-booking
- **Automatic Updates**: Real-time synchronization

#### Webhook Support
- Real-time updates from Google Calendar
- Automatic conflict resolution
- Change notifications

### Business Rules
- **Provider Ownership**: Only provider or their organization can create availability
- **Location Restrictions**: Availability can be location-specific
- **Service Alignment**: Only offered services can be booked
- **Advance Booking**: Configurable booking windows
- **Cancellation Policies**: Flexible cancellation rules

## 5. Communications Module (`/communications`)

**Purpose**: Multi-channel communication system for notifications and messaging

### Responsibilities
- Email notification system
- SMS messaging
- WhatsApp integration
- Notification templates and personalization
- Delivery tracking and logging

### Key Components
- **Email Engine**: Template-based email system
- **SMS Gateway**: SMS delivery with multiple providers
- **WhatsApp Integration**: WhatsApp Business API integration
- **Template Manager**: Dynamic template system
- **Delivery Tracker**: Message delivery status monitoring

### Communication Channels

#### Email System
- **Transactional Emails**: Booking confirmations, reminders, cancellations
- **Template Engine**: Dynamic templates with personalization
- **HTML & Text**: Both HTML and plain text versions
- **Delivery Tracking**: Open rates, click tracking, bounces

#### SMS Integration
- **Appointment Reminders**: Automated reminder system
- **Booking Confirmations**: Instant confirmation messages
- **Status Updates**: Real-time status change notifications
- **Two-Way SMS**: Support for reply handling

#### WhatsApp Business
- **Provider Confirmations**: WhatsApp notifications for providers
- **Rich Media**: Support for images, documents, location sharing
- **Template Messages**: Pre-approved message templates
- **Interactive Messages**: Buttons, quick replies, lists

### Notification Types

#### Booking-Related
- **Booking Confirmation**: Sent to patient and provider
- **Booking Reminder**: 24h and 2h before appointment
- **Booking Cancellation**: Immediate notification of cancellations
- **Booking Changes**: Updates to time, location, or details

#### Provider Notifications
- **New Booking**: Immediate notification of new bookings
- **Requirement Updates**: Admin actions on regulatory requirements
- **Organization Invitations**: Invitations to join organizations
- **Availability Reminders**: Prompts to update availability

#### Administrative
- **Account Verification**: Email verification for new accounts
- **Password Reset**: Secure password reset links
- **System Updates**: Platform updates and maintenance notices
- **Compliance Reminders**: Regulatory requirement renewals

### Template System

#### Dynamic Templates
```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[];
  variables: TemplateVariable[];
  content: {
    email?: EmailContent;
    sms?: string;
    whatsapp?: WhatsAppContent;
  };
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'date' | 'number' | 'boolean';
  required: boolean;
  description: string;
}
```

#### Personalization
- **Dynamic Content**: User-specific information insertion
- **Conditional Logic**: Show/hide content based on user data
- **Localization**: Multi-language support
- **Branding**: Organization-specific branding

### Business Rules
- **Opt-out Support**: Users can unsubscribe from communications
- **Delivery Preferences**: Users choose their preferred channels
- **Compliance**: GDPR, CAN-SPAM, TCPA compliance
- **Rate Limiting**: Prevent spam and abuse
- **Retry Logic**: Automatic retry for failed deliveries

## 6. Additional Feature Modules

### Auth Module (`/auth`)
**Purpose**: Authentication, authorization, and user management
- NextAuth.js integration with Google OAuth
- Role-based access control
- Session management
- User profile management

### Billing Module (`/billing`)
**Purpose**: Payment processing and subscription management
- Stripe integration for payments
- Subscription plans and billing cycles
- Usage-based billing for slots
- Payment history and invoicing

### Invitations Module (`/invitations`)
**Purpose**: User and provider invitation system
- Email-based invitations with secure tokens
- Invitation status tracking
- Expiration and resend functionality
- Custom invitation messages

### Profile Module (`/profile`)
**Purpose**: User profile and preference management
- Personal information management
- Notification preferences
- Privacy settings
- Account security options

### Reviews Module (`/reviews`)
**Purpose**: Rating and review system
- Provider reviews and ratings
- Organization feedback
- Review moderation
- Rating aggregation and display

## Cross-Feature Integration

### Data Flow Between Features
1. **User Registration** (Auth) → **Provider Onboarding** (Providers)
2. **Provider Approval** (Admin) → **Availability Creation** (Calendar)
3. **Organization Setup** (Organizations) → **Provider Invitations** (Invitations)
4. **Booking Creation** (Calendar) → **Notifications** (Communications)
5. **Payment Processing** (Billing) → **Service Activation** (Providers)

### Shared Dependencies
- **Type System**: Common types shared across features
- **Database Schema**: Prisma schema defines relationships
- **API Layer**: tRPC routers provide type-safe endpoints
- **Authentication**: Shared auth context across all features

### Integration Patterns
- **Event-Driven**: Features communicate through events
- **Service Layer**: Shared business logic in server actions
- **Type Safety**: TypeScript ensures compile-time integration checking
- **Database Transactions**: Atomic operations across feature boundaries

## Development Guidelines

### Adding New Features
1. **Create Feature Directory**: Follow standard structure
2. **Define Types**: Create comprehensive type definitions
3. **Implement Business Logic**: Server actions for complex operations
4. **Create tRPC Router**: Database operations and API endpoints
5. **Build UI Components**: Feature-specific components
6. **Write Hooks**: tRPC hooks for data fetching
7. **Add Tests**: Unit and integration tests
8. **Update Documentation**: Keep docs current

### Feature Interaction Best Practices
1. **Loose Coupling**: Features should be independent
2. **Clear Interfaces**: Well-defined APIs between features
3. **Event-Driven Communication**: Use events for cross-feature updates
4. **Shared Utilities**: Common functionality in shared libraries
5. **Type Safety**: Maintain type safety across feature boundaries

This comprehensive overview provides the foundation for understanding how all features work together in the MedBookings platform. Each feature is designed to be independent while integrating seamlessly with the overall system architecture.