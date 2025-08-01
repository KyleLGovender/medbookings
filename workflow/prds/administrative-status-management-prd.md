# Administrative Status Management System - PRD

## Introduction/Overview

The Administrative Status Management System provides administrators with comprehensive control over provider and organization operational states. This feature separates administrative approval status from subscription/billing status, creating a cleaner architecture where the operational status is computed from multiple factors rather than being directly set. This separation allows for more flexible administrative actions while maintaining clear business logic.

## Goals

1. **Eliminate Status Redundancy**: Remove overlapping status concepts between Provider, Subscription, and Trial statuses
2. **Enable Flexible Admin Control**: Allow administrators to manage provider states independently of subscription status
3. **Provide Clear Operational Status**: Compute a single, authoritative operational status that determines system permissions
4. **Maintain Audit Trail**: Track all administrative status changes with full context and reasoning
5. **Support Edge Cases**: Handle special scenarios like free access, compliance suspensions, and billing disputes

## User Stories

1. **As an admin**, I want to suspend a provider for compliance review without affecting their subscription, so that I can investigate issues while preserving their billing relationship.

2. **As an admin**, I want to manually activate a provider who has special billing arrangements, so that I can support custom business relationships.

3. **As an admin**, I want to see why a provider is in their current operational status (admin decision vs subscription vs trial), so that I can make informed decisions about their account.

4. **As an admin**, I want to reactivate a cancelled provider account, so that returning providers don't need to re-register.

5. **As an admin**, I want to view the complete history of status changes for a provider, so that I can understand the account lifecycle and audit administrative actions.

## Functional Requirements

### 1. Status Model Implementation

1.1. The system must implement three separate status enums:
   - `AdministrativeStatus`: PENDING_APPROVAL, REJECTED, ACTIVE, SUSPENDED, CANCELLED
   - `SubscriptionStatus`: ACTIVE, PAST_DUE, CANCELLED, EXPIRED, NONE
   - `TrialStatus`: NOT_STARTED, ACTIVE, EXPIRING_SOON, EXPIRED

1.2. The system must compute `ProviderStatus` (operational status) based on the combination of these three statuses using defined business rules.

1.3. The computed `ProviderStatus` must be the sole authority for determining provider permissions throughout the system.

### 2. Administrative Status Management

2.1. The system must allow ADMIN and SUPER_ADMIN roles to change a provider's Administrative Status.

2.2. The system must display a dropdown selector showing all available Administrative Status options in the provider detail view.

2.3. The system must show an "Update Status" button that becomes active when the dropdown selection changes.

2.4. The system must require a confirmation dialog with a mandatory reason field for all status changes.

2.5. The system must show warning dialogs with operational impact descriptions for destructive actions (SUSPEND, CANCEL).

### 3. Status Display

3.1. The system must display all four statuses in the admin interface:
   - Administrative Status (with dropdown for changes)
   - Subscription Status (read-only)
   - Trial Status (read-only)
   - Provider Status (computed, read-only)

3.2. The system must clearly indicate which status is computed vs manually set.

3.3. The system must show visual indicators (badges/colors) for each status type.

### 4. Trial Management

4.1. The system must provide a separate "Start Trial" button for providers with NOT_STARTED trial status.

4.2. The trial activation must be independent of the administrative status change flow.

4.3. The system must only show the trial activation button when Administrative Status is ACTIVE and no subscription exists.

### 5. Status History

5.1. The system must maintain a complete audit trail of all status changes.

5.2. The system must provide a "Status History" tab in the provider detail view.

5.3. The status history must display:
   - Timestamp of change
   - Previous status
   - New status
   - Admin who made the change
   - Reason provided
   - Status type (Administrative, Subscription, Trial)

5.4. The history view must include filters for date range and status type.

5.5. The system must retain status history indefinitely.

### 6. Business Rules

6.1. When Administrative Status is SUSPENDED:
   - Existing bookings must remain active
   - No new bookings can be created
   - Provider cannot modify availability
   - Provider profile must be hidden from customer views

6.2. When SubscriptionStatus is PAST_DUE:
   - Service must stop immediately (no grace period)
   - Provider Status must show PAYMENT_OVERDUE

6.3. Operational Status Calculation:
   - If AdministrativeStatus is PENDING_APPROVAL, REJECTED, SUSPENDED, or CANCELLED, use that as ProviderStatus
   - If AdministrativeStatus is ACTIVE:
     - If Trial is ACTIVE OR Subscription is ACTIVE → ProviderStatus = ACTIVE
     - If Subscription is PAST_DUE → ProviderStatus = PAYMENT_OVERDUE
     - If Trial is EXPIRED and Subscription is NONE → ProviderStatus = TRIAL_EXPIRED
     - Otherwise → ProviderStatus = APPROVED

### 7. Free Access Support

7.1. The system must support a FREE subscription type that never expires.

7.2. Administrators must be able to create/assign FREE subscriptions to providers.

7.3. Providers with FREE subscriptions must be treated as having an active subscription for operational status calculation.

7.4. The system must provide a "Create FREE Subscription" button in the provider detail view when no subscription exists.

7.5. The FREE subscription creation must require a reason/note for audit purposes.

7.6. The system must clearly display "FREE Subscription" in the subscription status area when active.

### 8. Organization Support

8.1. The system must implement the exact same status management pattern for Organizations.

8.2. Organizations do not require regulatory requirements management (unlike Providers).

8.3. All other functionality must be identical between Provider and Organization status management.

## Non-Goals (Out of Scope)

1. **Email Notifications**: Automated emails for status changes will be implemented in a future phase
2. **In-App Notifications**: No in-app notifications will be shown to affected providers
3. **Payment System Integration**: Special payment handling for status changes is deferred
4. **Bulk Status Changes**: Changing multiple providers' status at once is not supported
5. **Scheduled Status Changes**: Future-dated status changes are not supported
6. **API Access**: External API access for status management is not included
7. **Export Functionality**: Audit log export for compliance is a future enhancement
8. **Retroactive History**: No history entries will be created for existing providers' current status

## Design Considerations

### UI Components

1. **Status Dropdown**: Standard select component with all Administrative Status options
2. **Update Button**: Primary action button, disabled until status changes
3. **Confirmation Modal**: 
   - Title: "Confirm Status Change"
   - Show current status → new status
   - Required textarea for reason
   - Cancel and Confirm buttons
   - Warning text for destructive actions

4. **Status Badges**: Color-coded badges for each status type
   - Administrative: Blue variants
   - Subscription: Green (active) / Red (issues) variants  
   - Trial: Purple variants
   - Operational: Mixed based on state

5. **History Table**: Sortable, filterable table with pagination

### Layout

- Status display section at top of provider detail view
- Four status badges displayed horizontally
- Administrative status includes dropdown and update button
- History tab added to existing tab structure

## Technical Considerations

1. **Database Changes**:
   - Add `administrativeStatus` field to Provider model
   - Create StatusChangeHistory table
   - Add FREE subscription type to SubscriptionPlan

2. **Computed Field**: ProviderStatus becomes a computed field, not stored in database

3. **Real-time Updates**: Status changes should refresh the UI immediately

4. **Permissions**: Both ADMIN and SUPER_ADMIN roles have identical permissions for status management

5. **Transaction Safety**: Status changes and history logging must be atomic

6. **Integration Order**: First implement the core status system, then update the availability system to use the new computed ProviderStatus

## Success Metrics

1. **Reduction in Status Confusion**: Fewer support tickets about provider status inconsistencies
2. **Admin Efficiency**: Time to resolve status-related issues reduced by 50%
3. **Audit Compliance**: 100% of status changes have associated reasons and admin attribution
4. **System Reliability**: Zero instances of providers in impossible status combinations
5. **User Satisfaction**: Admin satisfaction with status management workflow > 4/5

## Open Questions

None - all questions have been resolved.