# Organization-Provider Connection Invitation Workflow - Implementation Tasks

## Relevant Files

- `prisma/schema.prisma` - Add ProviderInvitation model and extend Enums for invitation status tracking
- `src/features/organizations/types/index.ts` - Type definitions for organization invitation functionality
- `src/features/providers/types/index.ts` - Type definitions for provider invitation and connection management
- `src/features/organizations/lib/invitations.ts` - Core business logic for sending and managing provider invitations
- `src/features/providers/lib/connections.ts` - Core business logic for provider connection management
- `src/features/organizations/components/ProviderInvitationForm.tsx` - Form component for sending provider invitations
- `src/features/organizations/components/ProviderInvitationList.tsx` - List component for viewing invitation status
- `src/features/providers/components/OrganizationConnectionsManager.tsx` - Component for managing organization connections and invitations
- `src/features/providers/components/InvitationCard.tsx` - Individual invitation display component
- `src/app/api/organizations/[id]/provider-invitations/route.ts` - API endpoints for organization invitation management
- `src/app/api/providers/invitations/route.ts` - API endpoints for provider invitation acceptance/rejection
- `src/app/api/providers/connections/route.ts` - API endpoints for provider connection management
- `src/app/invitation/[token]/page.tsx` - Landing page for invitation acceptance (handles both existing and new users)
- `src/features/organizations/hooks/useProviderInvitations.ts` - React hooks for organization invitation management
- `src/features/providers/hooks/useOrganizationConnections.ts` - React hooks for provider connection management
- `src/lib/email/templates.ts` - Email template functions for invitation communications
- `src/lib/email/logger.ts` - Email logging utility for console output during development

### Notes

- All code must be strongly typed based on the Prisma schema
- Email functionality will use console logging for development until email service is implemented

## Tasks

- [x] 1.0 Database Schema Updates and Models

  - [x] 1.1 Add ProviderInvitation model to schema.prisma with fields for email, token, status, custom message, organization reference, expiry date
  - [x] 1.2 Add ProviderInvitationStatus Enum (PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED, DELIVERY_FAILED)
  - [x] 1.3 Update ConnectionStatus Enum if needed for invitation-based connections
  - [x] 1.4 Add database indexes for efficient querying (email, token, organizationId, status)
  - [x] 1.5 Run Prisma migration and generate updated client
  - [x] 1.6 Create TypeScript types based on updated Prisma schema

- [x] 2.0 Backend API Development

  - [x] 2.1 Create API route for organizations to send provider invitations (POST /api/organizations/[id]/provider-invitations)
  - [x] 2.2 Create API route for organizations to list their sent invitations (GET /api/organizations/[id]/provider-invitations)
  - [x] 2.3 Create API route for organizations to cancel invitations (DELETE /api/organizations/[id]/provider-invitations/[invitationId])
  - [x] 2.4 Create API route for organizations to resend invitations (POST /api/organizations/[id]/provider-invitations/[invitationId]/resend)
  - [x] 2.5 Create API route for providers to list their received invitations (GET /api/providers/invitations)
  - [x] 2.6 Create API route for invitation acceptance/rejection (POST /api/providers/invitations/[token]/respond)
  - [x] 2.7 Create API route for providers to list their organization connections (GET /api/providers/connections)
  - [x] 2.8 Create API route for providers to manage connections (PUT /api/providers/connections/[connectionId])
  - [x] 2.9 Implement secure token generation and validation logic
  - [x] 2.10 Add permission checks for organization roles (OWNER and ADMIN only)
  - [x] 2.11 Implement duplicate connection prevention logic
  - [x] 2.12 Add email logging functionality for all invitation communications

- [ ] 3.0 Organization Dashboard Integration

  - [ ] 3.1 Create ProviderInvitationForm component with email input and optional custom message
  - [ ] 3.2 Create ProviderInvitationList component showing invitation status, dates, and actions
  - [ ] 3.3 Add invitation management section to organization dashboard
  - [ ] 3.4 Implement invitation status indicators (pending, accepted, rejected, cancelled, expired)
  - [ ] 3.5 Add cancel and resend functionality to invitation list items
  - [ ] 3.6 Create useProviderInvitations hook for invitation state management
  - [ ] 3.7 Add form validation and error handling for invitation sending
  - [ ] 3.8 Integrate with existing organization permission system

- [ ] 4.0 Provider Dashboard Integration

  - [ ] 4.1 Create OrganizationConnectionsManager component for viewing connections and invitations
  - [ ] 4.2 Create InvitationCard component for individual invitation display and actions
  - [ ] 4.3 Add organization connections section to provider dashboard
  - [ ] 4.4 Implement invitation acceptance/rejection functionality
  - [ ] 4.5 Add connection management (suspend/cancel) functionality
  - [ ] 4.6 Create useOrganizationConnections hook for connection state management
  - [ ] 4.7 Display multiple organization connections with clear status indicators
  - [ ] 4.8 Add confirmation dialogs for destructive actions (reject, cancel connections)

- [ ] 5.0 Invitation Acceptance Flow and Landing Pages
  - [ ] 5.1 Create invitation landing page (/invitation/[token]) that detects user authentication status
  - [ ] 5.2 Implement existing user flow - direct invitation acceptance interface
  - [ ] 5.3 Implement new user flow - MedBookings introduction and registration guidance
  - [ ] 5.4 Add invitation context preservation throughout registration process
  - [ ] 5.5 Create post-registration invitation acceptance flow
  - [ ] 5.6 Add error handling for expired, invalid, or already-used tokens
  - [ ] 5.7 Implement responsive design for mobile and desktop
  - [ ] 5.8 Add success/failure feedback after invitation actions
  - [ ] 5.9 Create automatic OrganizationProviderConnection creation upon acceptance
  - [ ] 5.10 Add redirect logic to appropriate dashboards after successful acceptance
