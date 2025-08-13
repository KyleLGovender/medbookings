// =============================================================================
// INVITATIONS FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for invitation-specific types and API responses
import { isValidDateString, isValidEmail, isValidUUID } from '@/types/guards';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isInvitationStatus(
  value: unknown
): value is 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' {
  return (
    typeof value === 'string' &&
    ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(value)
  );
}

export function isInvitationType(
  value: unknown
): value is 'ORGANIZATION_MEMBERSHIP' | 'PROVIDER_CONNECTION' | 'ADMIN_ACCESS' {
  return (
    typeof value === 'string' &&
    ['ORGANIZATION_MEMBERSHIP', 'PROVIDER_CONNECTION', 'ADMIN_ACCESS'].includes(value)
  );
}

export function isInvitationAction(
  value: unknown
): value is 'ACCEPT' | 'REJECT' | 'CANCEL' | 'RESEND' | 'EXTEND' {
  return (
    typeof value === 'string' && ['ACCEPT', 'REJECT', 'CANCEL', 'RESEND', 'EXTEND'].includes(value)
  );
}

export function isMembershipRole(value: unknown): value is 'ADMIN' | 'MANAGER' | 'MEMBER' {
  return typeof value === 'string' && ['ADMIN', 'MANAGER', 'MEMBER'].includes(value);
}

// =============================================================================
// ORGANIZATION INVITATION GUARDS
// =============================================================================

export function isValidCreateOrganizationInvitationData(value: unknown): value is {
  email: string;
  organizationId: string;
  role: string;
  customMessage?: string;
  expiresAt?: string;
  permissions?: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    'organizationId' in value &&
    'role' in value &&
    isValidEmail((value as any).email) &&
    isValidUUID((value as any).organizationId) &&
    isMembershipRole((value as any).role) &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).expiresAt || isValidDateString((value as any).expiresAt)) &&
    (!(value as any).permissions ||
      (Array.isArray((value as any).permissions) &&
        (value as any).permissions.every((perm: unknown) => typeof perm === 'string')))
  );
}

export function isValidOrganizationInvitationData(value: unknown): value is {
  id: string;
  email: string;
  status: string;
  role: string;
  customMessage?: string;
  expiresAt: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'status' in value &&
    'role' in value &&
    'expiresAt' in value &&
    'createdAt' in value &&
    'organization' in value &&
    'invitedBy' in value &&
    isValidUUID((value as any).id) &&
    isValidEmail((value as any).email) &&
    isInvitationStatus((value as any).status) &&
    isMembershipRole((value as any).role) &&
    isValidDateString((value as any).expiresAt) &&
    isValidDateString((value as any).createdAt) &&
    typeof (value as any).organization === 'object' &&
    (value as any).organization !== null &&
    'id' in (value as any).organization &&
    'name' in (value as any).organization &&
    isValidUUID((value as any).organization.id) &&
    typeof (value as any).organization.name === 'string' &&
    typeof (value as any).invitedBy === 'object' &&
    (value as any).invitedBy !== null &&
    'id' in (value as any).invitedBy &&
    'name' in (value as any).invitedBy &&
    'email' in (value as any).invitedBy &&
    isValidUUID((value as any).invitedBy.id) &&
    typeof (value as any).invitedBy.name === 'string' &&
    isValidEmail((value as any).invitedBy.email) &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).organization.description ||
      typeof (value as any).organization.description === 'string') &&
    (!(value as any).organization.logo || typeof (value as any).organization.logo === 'string')
  );
}

// =============================================================================
// PROVIDER INVITATION GUARDS
// =============================================================================

export function isValidCreateProviderInvitationData(value: unknown): value is {
  email: string;
  organizationId: string;
  customMessage?: string;
  expiresAt?: string;
  preferredServices?: string[];
  locationIds?: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    'organizationId' in value &&
    isValidEmail((value as any).email) &&
    isValidUUID((value as any).organizationId) &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).expiresAt || isValidDateString((value as any).expiresAt)) &&
    (!(value as any).preferredServices ||
      (Array.isArray((value as any).preferredServices) &&
        (value as any).preferredServices.every((id: unknown) => isValidUUID(id)))) &&
    (!(value as any).locationIds ||
      (Array.isArray((value as any).locationIds) &&
        (value as any).locationIds.every((id: unknown) => isValidUUID(id))))
  );
}

export function isValidProviderInvitationData(value: unknown): value is {
  id: string;
  email: string;
  status: string;
  customMessage?: string;
  expiresAt: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    description?: string;
    website?: string;
    locations?: Array<{
      id: string;
      name: string;
      formattedAddress: string;
    }>;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'status' in value &&
    'expiresAt' in value &&
    'createdAt' in value &&
    'organization' in value &&
    'invitedBy' in value &&
    isValidUUID((value as any).id) &&
    isValidEmail((value as any).email) &&
    isInvitationStatus((value as any).status) &&
    isValidDateString((value as any).expiresAt) &&
    isValidDateString((value as any).createdAt) &&
    typeof (value as any).organization === 'object' &&
    (value as any).organization !== null &&
    'id' in (value as any).organization &&
    'name' in (value as any).organization &&
    isValidUUID((value as any).organization.id) &&
    typeof (value as any).organization.name === 'string' &&
    typeof (value as any).invitedBy === 'object' &&
    (value as any).invitedBy !== null &&
    'id' in (value as any).invitedBy &&
    'name' in (value as any).invitedBy &&
    'email' in (value as any).invitedBy &&
    'role' in (value as any).invitedBy &&
    isValidUUID((value as any).invitedBy.id) &&
    typeof (value as any).invitedBy.name === 'string' &&
    isValidEmail((value as any).invitedBy.email) &&
    typeof (value as any).invitedBy.role === 'string' &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).organization.description ||
      typeof (value as any).organization.description === 'string') &&
    (!(value as any).organization.website ||
      typeof (value as any).organization.website === 'string') &&
    (!(value as any).organization.locations ||
      (Array.isArray((value as any).organization.locations) &&
        (value as any).organization.locations.every(
          (loc: unknown) =>
            typeof loc === 'object' &&
            loc !== null &&
            'id' in loc &&
            'name' in loc &&
            'formattedAddress' in loc &&
            isValidUUID((loc as any).id) &&
            typeof (loc as any).name === 'string' &&
            typeof (loc as any).formattedAddress === 'string'
        ))) &&
    (!(value as any).provider ||
      (typeof (value as any).provider === 'object' &&
        (value as any).provider !== null &&
        'id' in (value as any).provider &&
        'name' in (value as any).provider &&
        'email' in (value as any).provider &&
        'status' in (value as any).provider &&
        isValidUUID((value as any).provider.id) &&
        typeof (value as any).provider.name === 'string' &&
        isValidEmail((value as any).provider.email) &&
        typeof (value as any).provider.status === 'string'))
  );
}

// =============================================================================
// INVITATION ACTION GUARDS
// =============================================================================

export function isValidInvitationActionData(value: unknown): value is {
  action: string;
  invitationId: string;
  reason?: string;
  metadata?: Record<string, any>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'invitationId' in value &&
    isInvitationAction((value as any).action) &&
    isValidUUID((value as any).invitationId) &&
    (!(value as any).reason || typeof (value as any).reason === 'string') &&
    (!(value as any).metadata || typeof (value as any).metadata === 'object')
  );
}

export function isValidAcceptInvitationData(value: unknown): value is {
  invitationId: string;
  token: string;
  userData?: {
    name?: string;
    phone?: string;
    preferences?: Record<string, any>;
  };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'invitationId' in value &&
    'token' in value &&
    isValidUUID((value as any).invitationId) &&
    typeof (value as any).token === 'string' &&
    (value as any).token.length > 0 &&
    (!(value as any).userData ||
      (typeof (value as any).userData === 'object' &&
        (value as any).userData !== null &&
        (!(value as any).userData.name || typeof (value as any).userData.name === 'string') &&
        (!(value as any).userData.phone || typeof (value as any).userData.phone === 'string') &&
        (!(value as any).userData.preferences ||
          typeof (value as any).userData.preferences === 'object')))
  );
}

export function isValidRejectInvitationData(value: unknown): value is {
  invitationId: string;
  token: string;
  reason?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'invitationId' in value &&
    'token' in value &&
    isValidUUID((value as any).invitationId) &&
    typeof (value as any).token === 'string' &&
    (value as any).token.length > 0 &&
    (!(value as any).reason || typeof (value as any).reason === 'string')
  );
}

// =============================================================================
// BULK INVITATION GUARDS
// =============================================================================

export function isValidBulkInvitationData(value: unknown): value is {
  organizationId: string;
  type: string;
  invitations: Array<{
    email: string;
    role?: string;
    customMessage?: string;
    metadata?: Record<string, any>;
  }>;
  commonMessage?: string;
  expiresAt?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'organizationId' in value &&
    'type' in value &&
    'invitations' in value &&
    isValidUUID((value as any).organizationId) &&
    isInvitationType((value as any).type) &&
    Array.isArray((value as any).invitations) &&
    (value as any).invitations.length > 0 &&
    (value as any).invitations.every(
      (invitation: unknown) =>
        typeof invitation === 'object' &&
        invitation !== null &&
        'email' in invitation &&
        isValidEmail((invitation as any).email) &&
        (!(invitation as any).role || typeof (invitation as any).role === 'string') &&
        (!(invitation as any).customMessage ||
          typeof (invitation as any).customMessage === 'string') &&
        (!(invitation as any).metadata || typeof (invitation as any).metadata === 'object')
    ) &&
    (!(value as any).commonMessage || typeof (value as any).commonMessage === 'string') &&
    (!(value as any).expiresAt || isValidDateString((value as any).expiresAt))
  );
}

export function isValidBulkInvitationResult(value: unknown): value is {
  totalInvitations: number;
  successfulInvitations: number;
  failedInvitations: number;
  results: Array<{
    email: string;
    success: boolean;
    invitationId?: string;
    error?: string;
  }>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'totalInvitations' in value &&
    'successfulInvitations' in value &&
    'failedInvitations' in value &&
    'results' in value &&
    typeof (value as any).totalInvitations === 'number' &&
    (value as any).totalInvitations >= 0 &&
    typeof (value as any).successfulInvitations === 'number' &&
    (value as any).successfulInvitations >= 0 &&
    typeof (value as any).failedInvitations === 'number' &&
    (value as any).failedInvitations >= 0 &&
    Array.isArray((value as any).results) &&
    (value as any).results.every(
      (result: unknown) =>
        typeof result === 'object' &&
        result !== null &&
        'email' in result &&
        'success' in result &&
        isValidEmail((result as any).email) &&
        typeof (result as any).success === 'boolean' &&
        (!(result as any).invitationId || isValidUUID((result as any).invitationId)) &&
        (!(result as any).error || typeof (result as any).error === 'string')
    )
  );
}

// =============================================================================
// INVITATION TEMPLATE GUARDS
// =============================================================================

export function isValidInvitationTemplate(value: unknown): value is {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isDefault: boolean;
  organizationId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'type' in value &&
    'subject' in value &&
    'bodyTemplate' in value &&
    'variables' in value &&
    'isDefault' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    isInvitationType((value as any).type) &&
    typeof (value as any).subject === 'string' &&
    (value as any).subject.length > 0 &&
    typeof (value as any).bodyTemplate === 'string' &&
    (value as any).bodyTemplate.length > 0 &&
    Array.isArray((value as any).variables) &&
    (value as any).variables.every((variable: unknown) => typeof variable === 'string') &&
    typeof (value as any).isDefault === 'boolean' &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId))
  );
}

// =============================================================================
// API RESPONSE GUARDS REMOVED
// =============================================================================
//
// Server response validation guards have been removed as part of the dual-source
// type safety migration. Components will use tRPC RouterOutputs for server
// data validation in Task 4.0.
//
// Removed:
// - isOrganizationInvitationListResponse
// - isProviderInvitationListResponse

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidInvitationSearchParams(value: unknown): value is {
  organizationId?: string;
  type?: string;
  status?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  invitedById?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).type || isInvitationType((value as any).type)) &&
    (!(value as any).status || isInvitationStatus((value as any).status)) &&
    (!(value as any).email || typeof (value as any).email === 'string') &&
    (!(value as any).startDate || isValidDateString((value as any).startDate)) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).invitedById || isValidUUID((value as any).invitedById))
  );
}

export function isValidInvitationAnalytics(value: unknown): value is {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  rejectedInvitations: number;
  expiredInvitations: number;
  acceptanceRate: number;
  averageResponseTime: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{
    date: string;
    invitations: number;
    acceptances: number;
  }>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'totalInvitations' in value &&
    'pendingInvitations' in value &&
    'acceptedInvitations' in value &&
    'rejectedInvitations' in value &&
    'expiredInvitations' in value &&
    'acceptanceRate' in value &&
    'averageResponseTime' in value &&
    'byType' in value &&
    'byStatus' in value &&
    'recentActivity' in value &&
    typeof (value as any).totalInvitations === 'number' &&
    (value as any).totalInvitations >= 0 &&
    typeof (value as any).pendingInvitations === 'number' &&
    (value as any).pendingInvitations >= 0 &&
    typeof (value as any).acceptedInvitations === 'number' &&
    (value as any).acceptedInvitations >= 0 &&
    typeof (value as any).rejectedInvitations === 'number' &&
    (value as any).rejectedInvitations >= 0 &&
    typeof (value as any).expiredInvitations === 'number' &&
    (value as any).expiredInvitations >= 0 &&
    typeof (value as any).acceptanceRate === 'number' &&
    (value as any).acceptanceRate >= 0 &&
    (value as any).acceptanceRate <= 1 &&
    typeof (value as any).averageResponseTime === 'number' &&
    (value as any).averageResponseTime >= 0 &&
    typeof (value as any).byType === 'object' &&
    typeof (value as any).byStatus === 'object' &&
    Array.isArray((value as any).recentActivity) &&
    (value as any).recentActivity.every(
      (activity: unknown) =>
        typeof activity === 'object' &&
        activity !== null &&
        'date' in activity &&
        'invitations' in activity &&
        'acceptances' in activity &&
        isValidDateString((activity as any).date) &&
        typeof (activity as any).invitations === 'number' &&
        typeof (activity as any).acceptances === 'number'
    )
  );
}
