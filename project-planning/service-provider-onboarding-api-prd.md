# Service Provider Onboarding API - Product Requirements Document

## Introduction/Overview

The Service Provider Onboarding API will enable healthcare providers to register on the MedBookings platform by submitting their professional information and required regulatory documentation. The API will also support an admin approval workflow to verify provider credentials before they can offer services on the platform. This feature is critical for maintaining the quality and legitimacy of service providers on the platform while providing a streamlined onboarding experience.

## Goals

1. Create a comprehensive RESTful API that handles all aspects of service provider onboarding
2. Support dynamic regulatory requirements based on provider type
3. Implement secure document upload functionality using AWS S3 presigned URLs
4. Establish an admin approval workflow for reviewing provider submissions
5. Enable in-app notifications and email communications for status updates
6. Provide robust validation at both client and server levels

## User Stories

### As a healthcare professional (User)

1. I want to register as a service provider so that I can offer my services on the platform
2. I want to upload my professional credentials and regulatory documents so that I can prove my qualifications
3. I want to receive notifications about my application status so that I know when I can start accepting bookings
4. I want to be able to update my profile information so that my details remain current

### As an admin

1. I want to review new service provider applications so that I can ensure they meet our quality standards
2. I want to approve or reject provider applications with feedback so that only qualified providers are listed
3. I want to see all required regulatory documents in one place so that I can efficiently verify credentials
4. I want to be notified when new applications are submitted so that I can review them promptly

## Functional Requirements

### Service Provider Profile Management

1. The API must allow users to create a new service provider profile with basic information (name, bio, image, contact details)
2. The API must associate the service provider profile with the authenticated user account
3. The API must allow users to select their service provider type (doctor, therapist, etc.)
4. The API must support updating existing service provider profiles
5. The API must handle profile image uploads via AWS S3 using secure URLs

### Regulatory Requirements Management

1. The API must dynamically fetch regulatory requirements based on the selected service provider type
2. The API must support all requirement validation types (BOOLEAN, DOCUMENT, TEXT, DATE, FUTURE_DATE, PAST_DATE, NUMBER, PREDEFINED_LIST)
3. The API must handle document uploads for regulatory requirements via AWS S3 using secure URLs
4. The API must store metadata for each requirement submission
5. The API must validate that all required submissions are completed before allowing submission for review

### Approval Workflow

1. The API must set the initial status of new service provider profiles to PENDING_APPROVAL
2. The API must provide endpoints for admins to list pending applications
3. The API must allow admins to approve or reject applications with comments
4. The API must update the service provider status based on admin actions
5. The API must trigger notifications when application status changes
6. The API must enforce role-based access control for approval actions (ADMIN or SUPER_ADMIN only)

### Notifications

1. The API must create in-app notifications for users when their application status changes
2. The API must create in-app notifications for admins when new applications are submitted
3. The API must support email notifications for important status updates

## Non-Goals (Out of Scope)

1. Calendar integration with external services (Google Calendar, etc.)
2. Service scheduling functionality
3. Payment processing for service providers
4. Public-facing provider discovery features
5. Advanced analytics on provider onboarding funnel
6. Multi-factor authentication specific to provider accounts

## Design Considerations

### API Structure

The API should follow RESTful conventions with these primary endpoints:

```typescript
/api/providers
  POST / - Create new service provider
  GET /:id - Get provider details
  PATCH /:id - Update provider details
  DELETE /:id - Delete provider

/api/providers/types
  GET / - List all provider types

/api/providers/requirements
  GET / - Get requirements for a provider type
  POST / - Submit requirement responses

/api/providers/approval
  GET / - List pending approvals (admin only)
  POST /:id/approve - Approve provider (admin only)
  POST /:id/reject - Reject provider (admin only)

/api/uploads
  POST /presigned - Generate presigned URL for S3 upload
```

### Data Models

The API will work with these primary data structures:

1. ServiceProvider - Core provider profile information
2. ServiceProviderType - Categories of providers with specific requirements
3. RequirementType - Regulatory requirements for each provider type
4. RequirementSubmission - Provider responses to requirements
5. Notification - System notifications for users and admins

## Technical Considerations

### Authentication & Authorization

- All API endpoints will require authentication via NextAuth.js
- Admin approval endpoints will require ADMIN or SUPER_ADMIN role
- Provider profile endpoints will require ownership verification (user ID match)

### Validation

- Server-side validation using Zod schemas
- Independent type definitions rather than derived from Prisma schema to avoid circular references
- Client-side validation using react-hook-form with Zod integration

### File Uploads

- Direct-to-S3 uploads using presigned URLs
- Metadata storage in the database with links to S3 objects
- Support for common document formats (PDF, DOC, DOCX, JPG, PNG)

### Notifications

- In-app notifications stored in the database
- Email notifications using a transactional email service
- Real-time updates using client-side polling with TanStack Query

## Success Metrics

For MVP:

1. A single service provider can successfully submit a registration request
2. An admin can review and approve the provider
3. The approved provider profile becomes visible and active on the platform

## Credential Expiration Management

The system must handle credential expiration for regulatory requirements with time limits:

1. **Expiration Tracking**:

   - Store expiration dates for time-limited credentials (e.g., medical insurance certificates)
   - Display expiration status in the admin interface and provider dashboard

2. **Status Management**:

   - Automatically change provider status to SUSPENDED when critical credentials expire
   - Prevent booking creation for providers with expired credentials

3. **Renewal Process**:

   - Allow providers to submit updated credentials before expiration
   - Maintain the same approval workflow for renewed credentials
   - Automatically restore provider status when new credentials are approved

4. **Notifications**:
   - Send notifications to providers before credential expiration (30, 15, 7 days)
   - Notify admins about providers with soon-to-expire credentials

## Implementation Decisions

1. **Document History**: The system will maintain a complete historical record of all document submissions with timestamps for audit purposes.
2. **Approval Process**: The system will not support partial approvals. Admins must approve or reject the entire application.
3. **Credential Expiration**: The system will not implement grace periods. Providers will be immediately suspended when credentials expire.
