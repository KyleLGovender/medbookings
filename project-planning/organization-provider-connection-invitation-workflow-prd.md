# Organization-Provider Connection Invitation Workflow PRD

## Introduction/Overview

This feature enables organizations to invite healthcare providers to join their network through an email-based invitation system. The workflow supports both existing MedBookings users and new users who have never used the platform, creating a low-barrier entry point for provider acquisition and platform growth.

The feature addresses the need for organizations to proactively build their provider networks by sending invitations to healthcare professionals, regardless of whether they are already registered on MedBookings. This creates a viral growth mechanism where organizations become acquisition channels for new providers.

## Goals

1. **Enable seamless provider network building** - Organizations can easily invite providers by email address
2. **Reduce barriers to entry** - New healthcare providers can join through organizational invitations
3. **Maintain data integrity** - Ensure proper connection establishment between verified entities
4. **Support flexible workflows** - Handle both existing users and new user registration flows
5. **Provide clear status tracking** - Organizations can monitor invitation status and manage relationships

## User Stories

### Story 1: Organization Admin Inviting Providers

**As an organization admin**, I want to invite someone to join our organization by email address so that I can build our provider network proactively.

- I can enter an email address and send a custom invitation message
- I can monitor the status of all sent invitations in my dashboard
- I can cancel pending invitations at any time
- I can send reminder emails for pending invitations
- I can manage (cancel/suspend) established provider relationships

### Story 2: Existing MedBookings Provider

**As a registered MedBookings provider**, I want to accept an invitation from an organization so I can schedule availability with them and expand my practice.

- I receive an email with invitation details and a secure link
- I can click the link to view invitation details and accept/reject
- There is a place in my provider dashboard where i can manage all existing organization connections. Invitations should also appear here.
- Upon acceptance, the connection is immediately established
- I can manage (cancel/suspend) the relationship from my provider dashboard
- I can be connected to multiple organizations simultaneously

### Story 3: New Healthcare Provider

**As a doctor who has never heard of MedBookings**, I want to accept an invitation from an organization so I can join the platform and work with them.

- I receive an email with invitation details and a secure link
- I can click the link... the page i land on should recognize that i am not a user and should give me some information on Med Bookings and direct me to the process to onboard
- I complete user account creation and service provider registration
- After registration, I can accept the pending invitation. I would simply look at the part of my dashboard where i manage organization connections and accept it the same way any provider would
- The connection is established upon invitation acceptance
- I can manage the relationship from my new provider dashboard

## Functional Requirements

### 1. Invitation Management System

1.1. Organizations (OWNER and ADMIN roles only) can send invitations to any email address
1.2. Invitations can but don't have to include a custom message field for personalization
1.3. System generates unique, secure invitation tokens for each invitation
1.4. Invitations expire after 30 days from creation
1.5. Organizations can cancel pending invitations at any time
1.6. Organizations can resend invitations (creates new token, extends expiry)
1.7. System tracks email delivery status (delivered, bounced, failed)

### 2. Invitation Acceptance Workflow

2.1. **For Existing Users**: Direct acceptance flow leading to immediate connection establishment
2.2. **For New Users**: Registration flow followed by invitation acceptance
2.3. Invitation links remain valid throughout user registration process (no timeout)
2.4. Users can reject invitations with optional reason
2.5. System prevents duplicate connections between same organization-provider pairs

### 3. Connection Establishment

3.1. Successful invitation acceptance creates `OrganizationProviderConnection` record
3.2. Connection status defaults to ACCEPTED upon invitation acceptance
3.3. Both organizations and providers can cancel/suspend connections post-establishment
3.4. Providers can be connected to multiple organizations simultaneously

### 4. Email Communication System

4.1. Send invitation emails with custom message and secure acceptance link
4.2. Send reminder emails for pending invitations (organization-triggered)
4.3. Send cancellation notifications when invitations are cancelled
4.4. Handle email delivery failures and update invitation status accordingly
4.5. All email communications to be logged as there is no email currently enabled in the app. Just make it a console log with the information and links that would be in the email for now

### 5. Status Tracking and Management

5.1. Track invitation states: PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
5.2. Organizations can view all invitation history and current status
5.3. Providers can view pending invitations in their dashboard (post-registration)

## Non-Goals (Out of Scope)

- Invitation analytics and reporting (open rates, acceptance rates)
- Bulk invitation import functionality
- Integration with external email marketing platforms
- Automated invitation campaigns or scheduling
- Provider discovery or recommendation features
- Monthly invitation limits or rate limiting (beyond basic spam prevention)
- Preview of organization details before user registration

## Design Considerations

### Data Model Extensions

- Create new `ProviderInvitation` model similar to existing `OrganizationInvitation`
- Maintain existing `OrganizationProviderConnection` model for established relationships
- Link invitations to User email addresses (not requiring existing ServiceProvider)
- Support polymorphic invitation acceptance (existing users vs new users)

### User Interface Requirements

- Organization dashboard section for invitation management
- Provider dashboard section for pending invitations and connections
- Email templates for all communication types
- Responsive invitation acceptance pages for both desktop and mobile
- Clear status indicators and action buttons throughout workflows

### Security Considerations

- Secure token generation for invitation links
- Email verification during new user registration
- Rate limiting on invitation sending to prevent spam
- Proper authentication checks for all invitation-related actions

## Technical Considerations

### Code Organization

- Implement primarily in `/src/features/providers` and `/src/features/organizations`
- Utilize existing types directory structure for strongly-typed interfaces
- All code must be strongly typed based on the Prisma schema
- Follow established patterns from existing invitation system (`OrganizationInvitation`)

### Database Schema Updates

- Add `ProviderInvitation` model with fields for email, token, status, custom message
- Extend existing Enums as needed for invitation and connection status tracking
- Maintain referential integrity between invitations and resulting connections

### Integration Points

- Email service for invitation and notification delivery
- Authentication system for secure link handling
- Existing user registration and service provider onboarding flows
- Organization and provider dashboard components

## Success Metrics

_Success metrics will be defined in future iterations. Initial implementation should focus on core functionality and user experience._

## Open Questions

1. **Email Template Design**: Should we create branded email templates that match organization branding, or use standard MedBookings templates?

2. **Invitation Reminder Frequency**: How often should organizations be able to send reminder emails? (e.g., max once per week)

3. **Connection Approval Workflow**: Should there be any intermediate approval steps after invitation acceptance, or should connections be immediately active?

4. **Multi-Organization Conflict Handling**: How should we handle scheduling conflicts when providers are connected to multiple organizations?

5. **Invitation Link Security**: Should invitation links be single-use only, or allow multiple accesses until expiry?

6. **Registration Flow Integration**: Should the invitation context be preserved throughout the entire registration process, or only linked at the final acceptance step?

---

**Next Steps**: Upon PRD approval, begin implementation with database schema updates and core invitation management functionality, followed by email system integration and user interface development.
