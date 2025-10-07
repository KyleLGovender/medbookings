/**
 * =============================================================================
 * INVITATIONS FEATURE TYPES
 * =============================================================================
 * All type definitions for the invitations feature in one place
 * Domain enums, business logic types, and form schemas only
 */

// =============================================================================
// MIGRATION NOTES - SERVER DATA REMOVED
// =============================================================================
//
// Removed server data:
// - All Prisma imports and re-exports
// - OrganizationInvitationWithRelations and ProviderInvitationWithRelations
// - InvitationFlowState.user (User from Prisma)
//
// Components will use tRPC RouterOutputs for server data in Task 4.0

// =============================================================================
// DOMAIN ENUMS
// =============================================================================

// Invitation status values
export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

// Provider invitation status values
export const ProviderInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProviderInvitationStatus =
  (typeof ProviderInvitationStatus)[keyof typeof ProviderInvitationStatus];

// Organization roles
export const OrganizationRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type OrganizationRole = (typeof OrganizationRole)[keyof typeof OrganizationRole];

// Organization permissions
export const OrganizationPermission = {
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  MANAGE_PROVIDERS: 'MANAGE_PROVIDERS',
  MANAGE_LOCATIONS: 'MANAGE_LOCATIONS',
  MANAGE_BILLING: 'MANAGE_BILLING',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
} as const;

export type OrganizationPermission =
  (typeof OrganizationPermission)[keyof typeof OrganizationPermission];

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

/**
 * Basic invitation information
 * Core invitation data including status, tokens, and timestamps
 *
 * @property {string} id - Unique invitation identifier
 * @property {string} email - Recipient email address
 * @property {string} token - Unique invitation token for authentication
 * @property {InvitationStatus | ProviderInvitationStatus} status - Current invitation status
 * @property {Date} expiresAt - Invitation expiration timestamp
 * @property {Date} createdAt - Invitation creation timestamp
 * @property {Date} [acceptedAt] - Timestamp when invitation was accepted
 * @property {Date} [rejectedAt] - Timestamp when invitation was rejected
 * @property {Date} [cancelledAt] - Timestamp when invitation was cancelled
 */
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

/**
 * Organization context information for invitations
 * Provides organization details shown to invited users
 *
 * @property {string} id - Unique organization identifier
 * @property {string} name - Organization display name
 * @property {string} [description] - Organization description
 * @property {string} [logo] - Organization logo URL
 * @property {string} [email] - Organization contact email
 * @property {string} [phone] - Organization contact phone
 * @property {string} [website] - Organization website URL
 */
export interface OrganizationContext {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

/**
 * User context information for invitations
 * Contains inviter's details shown in invitation emails and pages
 */
export interface UserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// General invitation data (for components that handle both types)
export interface InvitationData {
  id: string;
  email: string;
  customMessage?: string | null;
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
  // user will be typed using tRPC RouterOutputs in Task 4.0
  user?: any; // Temporary - will use RouterOutputs['auth']['getCurrentUser']
  error?: string;
  isNewUser: boolean;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request payload for creating organization member invitations
 * Used when inviting users to join an organization with specific roles and permissions
 *
 * @property {string} organizationId - Organization extending the invitation
 * @property {string} email - Recipient email address
 * @property {OrganizationRole} role - Role to assign to invited user
 * @property {OrganizationPermission[]} permissions - Permissions to grant
 * @property {string} [customMessage] - Custom message to include in invitation email
 * @property {number} [expiresInDays] - Days until invitation expires (default: 7)
 */
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

/**
 * Request payload for sending multiple invitations at once
 * Allows batch invitation creation with default roles and permissions
 *
 * @property {string} organizationId - Organization sending the invitations
 * @property {Array} invitations - List of individual invitation details
 * @property {OrganizationRole} [defaultRole] - Default role for invitations without specified role
 * @property {OrganizationPermission[]} [defaultPermissions] - Default permissions for invitations without specified permissions
 */
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
  // invitations will be typed using tRPC RouterOutputs in Task 4.0
  invitations: any[]; // Temporary - will use RouterOutputs['invitations']['getInvitations']
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

/**
 * Aggregated invitation statistics
 * Provides counts of invitations by status for analytics and reporting
 *
 * @property {number} total - Total number of invitations
 * @property {number} pending - Number of pending invitations
 * @property {number} accepted - Number of accepted invitations
 * @property {number} rejected - Number of rejected invitations
 * @property {number} expired - Number of expired invitations
 * @property {number} cancelled - Number of cancelled invitations
 */
export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  cancelled: number;
}

/**
 * Email template data for invitation messages
 * Contains all variables needed to render personalized invitation emails
 *
 * @property {string} recipientEmail - Recipient's email address
 * @property {string} inviterName - Name of person sending invitation
 * @property {string} organizationName - Organization name
 * @property {string} invitationUrl - Unique URL to accept invitation
 * @property {string} [customMessage] - Optional custom message from inviter
 * @property {Date} expiresAt - Invitation expiration date
 * @property {string} [role] - Role being offered (for display in email)
 */
export interface InvitationEmailTemplate {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  customMessage?: string;
  expiresAt: Date;
  role?: string;
}

/**
 * Invitation engagement tracking data
 * Tracks user interactions with invitation emails and pages for analytics
 *
 * @property {string} invitationId - Invitation being tracked
 * @property {boolean} emailSent - Whether invitation email was sent
 * @property {boolean} emailDelivered - Whether email was successfully delivered
 * @property {boolean} linkClicked - Whether invitation link was clicked
 * @property {boolean} pageViewed - Whether invitation page was viewed
 * @property {string} [actionTaken] - Final action taken (ACCEPTED or REJECTED)
 * @property {Date} [actionTimestamp] - When action was taken
 */
export interface InvitationTracking {
  invitationId: string;
  emailSent: boolean;
  emailDelivered: boolean;
  linkClicked: boolean;
  pageViewed: boolean;
  actionTaken?: 'ACCEPTED' | 'REJECTED';
  actionTimestamp?: Date;
}
