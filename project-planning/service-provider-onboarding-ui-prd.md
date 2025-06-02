# Service Provider Onboarding UI - Product Requirements Document

## Introduction/Overview

The Service Provider Onboarding UI will provide a user-friendly interface for healthcare professionals to register as service providers on the MedBookings platform. This UI will enable providers to submit their professional information and required regulatory documentation in a single comprehensive form. The UI will also include an admin interface for reviewing and approving provider applications, ensuring only qualified professionals are listed on the platform.

## Goals

1. Create an intuitive, single-form interface for service provider registration
2. Support all provider types and their dynamic regulatory requirements
3. Implement secure document uploads with clear guidance on requirements
4. Provide real-time validation feedback to reduce submission errors
5. Create an efficient admin review interface for approval workflows
6. Ensure full responsiveness across desktop and mobile devices

## User Stories

### As a healthcare professional (User)

1. I want a clear, well-organized registration form so I can easily understand what information is required
2. I want immediate feedback on validation errors so I can correct mistakes before submission
3. I want to easily upload my professional credentials and regulatory documents with clear instructions
4. I want to see my application status and receive notifications about updates
5. I want to be able to update my profile information after submission

### As an admin

1. I want a dedicated interface to review pending provider applications efficiently
2. I want to see all required regulatory documents organized by requirement type
3. I want to easily approve or reject applications with the ability to provide feedback
4. I want to be notified when new applications are submitted
5. I want to track credential expirations and manage provider status

## Functional Requirements

### Single Form Registration

1. The UI must implement a single comprehensive form with clear section headers
2. The form must include the following sections:
   - Basic Information (name, bio, contact details)
   - Provider Type Selection
   - Professional Details (qualifications, experience)
   - Regulatory Requirements (dynamic based on provider type)
   - Services Offered
3. The UI must validate the entire form upon submission
4. The UI must display a confirmation dialog before final submission
5. The UI must show a success confirmation after profile creation

### Provider Profile Management

1. The UI must provide forms for entering all required provider profile information
2. The UI must include an image upload component with preview and cropping functionality
3. The UI must display validation errors inline with form fields
4. The UI must show a success confirmation after profile creation
5. The UI must provide access to edit the profile after submission

### Regulatory Requirements Interface

1. The UI must dynamically render different input types based on requirement validation types:
   - BOOLEAN: Toggle/checkbox inputs
   - DOCUMENT: File upload components
   - TEXT: Text inputs
   - DATE/FUTURE_DATE/PAST_DATE: Date pickers with appropriate validation
   - NUMBER: Numeric inputs with validation
   - PREDEFINED_LIST: Dropdown/select components
2. The UI must clearly indicate required vs. optional fields
3. The UI must show document upload progress indicators
4. The UI must display previews for uploaded documents where applicable
5. The UI must allow replacing uploaded documents before submission

### Document Upload Components

1. The UI must implement drag-and-drop file upload functionality
2. The UI must validate file types and sizes before upload
3. The UI must show clear error messages for invalid files
4. The UI must display upload progress and success/failure status
5. The UI must allow deletion and replacement of uploaded files
6. The UI must use AWS S3 presigned URLs for secure uploads
7. The UI must support PDF document preview for admins during the review process



### Admin Review Interface

1. The UI must provide a dashboard listing all pending provider applications
2. The UI must allow filtering and sorting applications by date, provider type, etc.
3. The UI must display a detailed view of each application with all submitted information
4. The UI must organize regulatory documents by requirement type for easy review
5. The UI must include document preview functionality for submitted documents
6. The UI must include approve/reject buttons with a comment field for each requirement
7. The UI must show confirmation dialogs for approval/rejection actions
8. The UI must provide a history of previously reviewed applications
9. The UI must implement in-app communications to notify admins of new submissions
10. The UI must display a count of pending reviews in the admin dashboard

### Status and Notifications

1. The UI must display the current application status prominently
2. The UI must show a timeline of application status changes
3. The UI must integrate with the in-app notification system
4. The UI must display validation errors clearly with guidance on resolution

## Non-Goals (Out of Scope)

1. Building a public-facing provider profile page (separate feature)
2. Implementing service scheduling functionality
3. Building payment processing for providers
4. Creating advanced analytics dashboards for onboarding funnel
5. Implementing provider-specific authentication mechanisms
6. Building calendar integration interfaces

## Design Considerations

### UI Components

1. The UI should use a consistent design system across all steps
2. The UI should implement responsive layouts that work well on both desktop and mobile
3. The wizard navigation should be intuitive with clear next/previous controls
4. Form validation errors should be displayed inline with affected fields
5. Success/error notifications should be non-intrusive but clearly visible
6. The UI should include loading states for asynchronous operations

### User Experience

1. The UI should minimize cognitive load by breaking the process into logical steps
2. The UI should provide clear instructions at each step
3. The UI should implement autosave functionality to prevent data loss
4. The UI should offer contextual help and tooltips for complex requirements
5. The UI should provide estimated completion time for each step
6. The UI should implement smooth transitions between steps

## Technical Considerations

### Frontend Implementation

1. The UI will be built using React components within the Next.js App Router framework
2. The UI will use react-hook-form for form management with Zod schema validation
3. The UI will implement TanStack Query for data fetching and mutation
4. The UI will use client-side storage (localStorage) for temporary draft saving
5. The UI will implement proper form state management for the multi-step wizard

### Integration Points

1. The UI will integrate with the Service Provider Onboarding API endpoints
2. The UI will use AWS S3 presigned URLs for secure document uploads
3. The UI will integrate with the in-app notification system
4. The UI will use the authentication system for user identification and authorization

### Route Structure

The UI should follow the established Next.js App Router structure:

```typescript
/src/app/
  /(dashboard)/
    /providers/
      /new/
        page.tsx                        # Provider onboarding entry point
        loading.tsx                     # Loading state
        error.tsx                       # Error handling
      /[id]/
        /compliance/                    # Provider compliance status
          page.tsx                      # Compliance dashboard
    /admin/
      /providers/
        page.tsx                        # Admin provider management dashboard
        /pending/
          page.tsx                      # Pending applications list
        /[id]/
          page.tsx                      # Provider application review
          /requirements/
            page.tsx                    # Requirements review
```

### Component Structure

The UI components should follow the project structure:

```typescript
/src/features/providers/
  /components/
    /onboarding/
      ProviderOnboardingForm.tsx
      BasicInfoSection.tsx
      ProviderTypeSection.tsx
      ProfessionalDetailsSection.tsx
      RegulatoryRequirementsSection.tsx
      ServicesSection.tsx
      DocumentUploader.tsx
      DocumentPreview.tsx
  /hooks/
    useProviderOnboarding.ts
    useRequirementValidation.ts
    useDocumentUpload.ts
  /lib/
    providerOnboarding.ts
  /types/
    providerOnboarding.ts
```

For the admin interface:

```
/src/features/admin/
  /components/
    /providers/
      PendingProvidersTable.tsx
      ProviderReviewDetail.tsx
      RequirementReviewCard.tsx
      ApprovalActions.tsx
      DocumentReviewer.tsx
  /hooks/
    useProviderApproval.ts
  /lib/
    providerReview.ts
  /types/
    providerReview.ts
```

## Success Metrics

For MVP:

1. A single service provider can successfully submit a registration request through the UI
2. An admin can review and approve the provider through the admin interface
3. The approved provider profile becomes visible and active on the platform

## Implementation Notes

1. **Provider Dashboard:** The UI will include a provider dashboard showing application status and required actions.

2. **Regulatory Requirements:** Based on the provided example, the UI will handle approximately 9-10 requirements per provider type, which is manageable within a single form approach. Requirements will be grouped logically in sections within the form.

3. **Document Preview:** The UI will implement document preview functionality for admins to review submitted documents (especially PDFs) directly in the interface without needing to download them.

4. **Concurrent Users:** The system is designed to handle moderate traffic with peaks of approximately 10 registrations per hour.

5. **Admin Communications:** The UI will implement in-app communications to notify admins of new submissions and provide a dashboard view of pending applications that need review.

6. **Expected Requirements Types:** The UI will support all requirement validation types shown in the example, including:
   - BOOLEAN (Yes/No questions)
   - TEXT (Text input with validation)
   - DOCUMENT (File uploads)
   - FUTURE_DATE (Date selection with future validation)
   - PAST_DATE (Date selection with past validation)
   - PREDEFINED_LIST (Dropdown selection with optional "Other" field)
