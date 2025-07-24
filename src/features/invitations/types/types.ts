// =============================================================================
// INVITATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the invitations feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  InvitationStatus,
  OrganizationInvitation,
  OrganizationPermission,
  OrganizationRole,
  ProviderInvitation,
  ProviderInvitationStatus,
  User,
} from '@prisma/client';

// =============================================================================
// ENUMS
// =============================================================================

// Re-export Prisma invitation-related enums for convenience
export { InvitationStatus, ProviderInvitationStatus, OrganizationRole, OrganizationPermission };

// Invitation action types
export enum InvitationAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  RESEND = 'RESEND',
}

// Invitation delivery status
export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Basic invitation info
export interface InvitationInfo {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus | ProviderInvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
}

// Organization context for invitations
export interface OrganizationContext {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
}

// User context for invitations
export interface UserContext {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// Extended organization invitation with all relations
export interface OrganizationInvitationWithRelations extends OrganizationInvitation {
  organization: OrganizationContext;
  invitedBy: UserContext;
}

// Extended provider invitation with all relations
export interface ProviderInvitationWithRelations extends ProviderInvitation {
  organization: OrganizationContext;
  invitedBy: UserContext;
}

// General invitation data (for components that handle both types)
export interface InvitationData {
  id: string;
  email: string;
  customMessage?: string;
  status: string;
  expiresAt: string;
  organization: OrganizationContext;
  invitedBy: UserContext;
  role?: OrganizationRole;
  permissions?: OrganizationPermission[];
}

// Invitation validation result
export interface InvitationValidation {
  isValid: boolean;
  invitation?: InvitationData;
  error?: string;
  reason?: 'EXPIRED' | 'NOT_FOUND' | 'ALREADY_ACCEPTED' | 'CANCELLED';
}

// Invitation flow state
export interface InvitationFlowState {
  step: 'LOADING' | 'VALIDATING' | 'ACCEPTING' | 'COMPLETING' | 'SUCCESS' | 'ERROR';
  invitation?: InvitationData;
  user?: User;
  error?: string;
  isNewUser: boolean;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

// Create organization invitation request
export interface CreateOrganizationInvitationRequest {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  permissions: OrganizationPermission[];
  customMessage?: string;
  expiresInDays?: number;
}

// Create provider invitation request
export interface CreateProviderInvitationRequest {
  organizationId: string;
  email: string;
  customMessage?: string;
  expiresInDays?: number;
}

// Accept invitation request
export interface AcceptInvitationRequest {
  token: string;
  userInfo?: {
    name?: string;
    phone?: string;
  };
}

// Reject invitation request
export interface RejectInvitationRequest {
  token: string;
  reason?: string;
}

// Resend invitation request
export interface ResendInvitationRequest {
  invitationId: string;
  customMessage?: string;
}

// Invitation response
export interface InvitationResponse {
  success: boolean;
  invitation?: InvitationData;
  error?: string;
  redirectUrl?: string;
}

// Bulk invitation request
export interface BulkInvitationRequest {
  organizationId: string;
  invitations: Array<{
    email: string;
    role?: OrganizationRole;
    permissions?: OrganizationPermission[];
    customMessage?: string;
  }>;
  defaultRole?: OrganizationRole;
  defaultPermissions?: OrganizationPermission[];
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

// Invitation page content props
export interface InvitationPageContentProps {
  token: string;
}

// Invitation flow props
export interface InvitationFlowProps {
  invitation: InvitationData;
  isNewUser: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Invitation list props
export interface InvitationListProps {
  invitations: (OrganizationInvitationWithRelations | ProviderInvitationWithRelations)[];
  organizationId: string;
  canManageInvitations: boolean;
  onInvitationAction?: (invitationId: string, action: InvitationAction) => void;
}

// Invitation form props
export interface InvitationFormProps {
  organizationId: string;
  type: 'organization' | 'provider';
  defaultRole?: OrganizationRole;
  defaultPermissions?: OrganizationPermission[];
  onSuccess?: (invitation: InvitationData) => void;
  onCancel?: () => void;
}

// Invitation error state props
export interface InvitationErrorStateProps {
  error: string;
  reason?: 'EXPIRED' | 'NOT_FOUND' | 'ALREADY_ACCEPTED' | 'CANCELLED';
  onRetry?: () => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Invitation query options
export interface InvitationQueryOptions {
  organizationId?: string;
  status?:
    | InvitationStatus
    | ProviderInvitationStatus
    | InvitationStatus[]
    | ProviderInvitationStatus[];
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

// Invitation statistics
export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  cancelled: number;
}

// Invitation email template data
export interface InvitationEmailTemplate {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  customMessage?: string;
  expiresAt: Date;
  role?: string;
}

// Invitation tracking data
export interface InvitationTracking {
  invitationId: string;
  emailSent: boolean;
  emailDelivered: boolean;
  linkClicked: boolean;
  pageViewed: boolean;
  actionTaken?: 'ACCEPTED' | 'REJECTED';
  actionTimestamp?: Date;
}
