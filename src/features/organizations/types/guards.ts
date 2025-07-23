// =============================================================================
// ORGANIZATIONS FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for organization-specific types and API responses

import { isValidEmail, isValidPhone, isValidUUID, isValidDateString } from '@/types/guards';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isOrganizationStatus(value: unknown): value is 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  return (
    typeof value === 'string' &&
    ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(value)
  );
}

export function isMembershipRole(value: unknown): value is 'ADMIN' | 'MANAGER' | 'MEMBER' {
  return (
    typeof value === 'string' &&
    ['ADMIN', 'MANAGER', 'MEMBER'].includes(value)
  );
}

export function isMembershipStatus(value: unknown): value is 'PENDING' | 'ACTIVE' | 'INACTIVE' {
  return (
    typeof value === 'string' &&
    ['PENDING', 'ACTIVE', 'INACTIVE'].includes(value)
  );
}

export function isProviderInvitationStatus(value: unknown): value is 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' {
  return (
    typeof value === 'string' &&
    ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'].includes(value)
  );
}

export function isInvitationAction(value: unknown): value is 'ACCEPT' | 'REJECT' | 'CANCEL' | 'RESEND' {
  return (
    typeof value === 'string' &&
    ['ACCEPT', 'REJECT', 'CANCEL', 'RESEND'].includes(value)
  );
}

export function isBillingModel(value: unknown): value is 'CONSOLIDATED' | 'PER_LOCATION' | 'HYBRID' {
  return (
    typeof value === 'string' &&
    ['CONSOLIDATED', 'PER_LOCATION', 'HYBRID'].includes(value)
  );
}

// =============================================================================
// ORGANIZATION CREATION AND UPDATE GUARDS
// =============================================================================

export function isValidCreateOrganizationData(value: unknown): value is {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).website || typeof (value as any).website === 'string') &&
    (!(value as any).description || typeof (value as any).description === 'string') &&
    (!(value as any).logo || typeof (value as any).logo === 'string')
  );
}

export function isValidUpdateOrganizationData(value: unknown): value is {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
  status?: string;
  billingModel?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).name || (typeof (value as any).name === 'string' && (value as any).name.length > 0)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).website || typeof (value as any).website === 'string') &&
    (!(value as any).description || typeof (value as any).description === 'string') &&
    (!(value as any).logo || typeof (value as any).logo === 'string') &&
    (!(value as any).status || isOrganizationStatus((value as any).status)) &&
    (!(value as any).billingModel || isBillingModel((value as any).billingModel))
  );
}

export function isValidOrganizationRegistrationData(value: unknown): value is {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  termsAccepted: boolean;
  billingType?: 'monthly' | 'yearly';
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'termsAccepted' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    typeof (value as any).termsAccepted === 'boolean' &&
    (value as any).termsAccepted === true &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).website || typeof (value as any).website === 'string') &&
    (!(value as any).description || typeof (value as any).description === 'string') &&
    (!(value as any).billingType || ['monthly', 'yearly'].includes((value as any).billingType))
  );
}

// =============================================================================
// MEMBERSHIP GUARDS
// =============================================================================

export function isValidCreateMembershipData(value: unknown): value is {
  organizationId: string;
  userId: string;
  role: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'organizationId' in value &&
    'userId' in value &&
    'role' in value &&
    isValidUUID((value as any).organizationId) &&
    isValidUUID((value as any).userId) &&
    isMembershipRole((value as any).role)
  );
}

export function isValidMembershipUpdate(value: unknown): value is {
  id: string;
  role?: string;
  status?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).role || isMembershipRole((value as any).role)) &&
    (!(value as any).status || isMembershipStatus((value as any).status))
  );
}

// =============================================================================
// LOCATION GUARDS
// =============================================================================

export function isValidCreateLocationData(value: unknown): value is {
  organizationId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'organizationId' in value &&
    'name' in value &&
    'formattedAddress' in value &&
    isValidUUID((value as any).organizationId) &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    typeof (value as any).formattedAddress === 'string' &&
    (value as any).formattedAddress.length > 0 &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).googlePlaceId || typeof (value as any).googlePlaceId === 'string')
  );
}

export function isValidLocationUpdate(value: unknown): value is {
  id: string;
  name?: string;
  formattedAddress?: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).name || (typeof (value as any).name === 'string' && (value as any).name.length > 0)) &&
    (!(value as any).formattedAddress || 
      (typeof (value as any).formattedAddress === 'string' && (value as any).formattedAddress.length > 0)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).googlePlaceId || typeof (value as any).googlePlaceId === 'string')
  );
}

export function isValidOrganizationLocation(value: unknown): value is {
  id?: string;
  name: string;
  organizationId?: string;
  formattedAddress?: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    (!(value as any).id || isValidUUID((value as any).id)) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).formattedAddress || typeof (value as any).formattedAddress === 'string') &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).googlePlaceId || typeof (value as any).googlePlaceId === 'string')
  );
}

// =============================================================================
// PROVIDER INVITATION GUARDS
// =============================================================================

export function isValidProviderInvitationData(value: unknown): value is {
  email: string;
  organizationId: string;
  customMessage?: string;
  expiresAt: string;
  invitedById?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    'organizationId' in value &&
    'expiresAt' in value &&
    isValidEmail((value as any).email) &&
    isValidUUID((value as any).organizationId) &&
    isValidDateString((value as any).expiresAt) &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).invitedById || isValidUUID((value as any).invitedById))
  );
}

export function isValidInvitationAction(value: unknown): value is {
  action: string;
  invitationId: string;
  reason?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'invitationId' in value &&
    isInvitationAction((value as any).action) &&
    isValidUUID((value as any).invitationId) &&
    (!(value as any).reason || typeof (value as any).reason === 'string')
  );
}

export function isValidProviderInvitationWithDetails(value: unknown): value is {
  id: string;
  email: string;
  status: string;
  customMessage?: string;
  createdAt: string;
  expiresAt: string;
  organization: { id: string; name: string };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'status' in value &&
    'createdAt' in value &&
    'expiresAt' in value &&
    'organization' in value &&
    isValidUUID((value as any).id) &&
    isValidEmail((value as any).email) &&
    isProviderInvitationStatus((value as any).status) &&
    isValidDateString((value as any).createdAt) &&
    isValidDateString((value as any).expiresAt) &&
    typeof (value as any).organization === 'object' &&
    (value as any).organization !== null &&
    'id' in (value as any).organization &&
    'name' in (value as any).organization &&
    isValidUUID((value as any).organization.id) &&
    typeof (value as any).organization.name === 'string' &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string')
  );
}

// =============================================================================
// PROVIDER CONNECTION GUARDS
// =============================================================================

export function isValidProviderConnection(value: unknown): value is {
  id: string;
  status: string;
  acceptedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  serviceProvider: {
    id: string;
    name: string;
    email: string;
  };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    'createdAt' in value &&
    'serviceProvider' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).status === 'string' &&
    isValidDateString((value as any).createdAt) &&
    ((value as any).acceptedAt === null || isValidDateString((value as any).acceptedAt)) &&
    ((value as any).suspendedAt === null || isValidDateString((value as any).suspendedAt)) &&
    typeof (value as any).serviceProvider === 'object' &&
    (value as any).serviceProvider !== null &&
    'id' in (value as any).serviceProvider &&
    'name' in (value as any).serviceProvider &&
    'email' in (value as any).serviceProvider &&
    isValidUUID((value as any).serviceProvider.id) &&
    typeof (value as any).serviceProvider.name === 'string' &&
    isValidEmail((value as any).serviceProvider.email)
  );
}

// =============================================================================
// API RESPONSE GUARDS
// =============================================================================

export function isOrganizationListResponse(value: unknown): value is Array<{
  id: string;
  name: string;
  email?: string;
  status: string;
  billingModel?: string;
  _count?: { memberships: number; locations: number; providerConnections: number };
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'name' in item &&
      'status' in item &&
      isValidUUID((item as any).id) &&
      typeof (item as any).name === 'string' &&
      isOrganizationStatus((item as any).status) &&
      (!(item as any).email || isValidEmail((item as any).email)) &&
      (!(item as any).billingModel || isBillingModel((item as any).billingModel))
    )
  );
}

export function isMembershipListResponse(value: unknown): value is Array<{
  id: string;
  role: string;
  status: string;
  user: { id: string; name: string; email: string };
  organization: { id: string; name: string };
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'role' in item &&
      'status' in item &&
      'user' in item &&
      'organization' in item &&
      isValidUUID((item as any).id) &&
      isMembershipRole((item as any).role) &&
      isMembershipStatus((item as any).status) &&
      typeof (item as any).user === 'object' &&
      (item as any).user !== null &&
      'id' in (item as any).user &&
      'name' in (item as any).user &&
      'email' in (item as any).user &&
      isValidUUID((item as any).user.id) &&
      typeof (item as any).user.name === 'string' &&
      isValidEmail((item as any).user.email)
    )
  );
}

export function isLocationListResponse(value: unknown): value is Array<{
  id: string;
  name: string;
  formattedAddress?: string;
  phone?: string;
  email?: string;
  organizationId: string;
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'name' in item &&
      'organizationId' in item &&
      isValidUUID((item as any).id) &&
      typeof (item as any).name === 'string' &&
      isValidUUID((item as any).organizationId) &&
      (!(item as any).formattedAddress || typeof (item as any).formattedAddress === 'string') &&
      (!(item as any).phone || isValidPhone((item as any).phone)) &&
      (!(item as any).email || isValidEmail((item as any).email))
    )
  );
}

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidOrganizationSearchParams(value: unknown): value is {
  name?: string;
  email?: string;
  status?: string;
  billingModel?: string;
  hasLocations?: boolean;
  hasProviders?: boolean;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).name || typeof (value as any).name === 'string') &&
    (!(value as any).email || typeof (value as any).email === 'string') &&
    (!(value as any).status || isOrganizationStatus((value as any).status)) &&
    (!(value as any).billingModel || isBillingModel((value as any).billingModel)) &&
    (!(value as any).hasLocations || typeof (value as any).hasLocations === 'boolean') &&
    (!(value as any).hasProviders || typeof (value as any).hasProviders === 'boolean')
  );
}

export function isValidLocationSearchParams(value: unknown): value is {
  name?: string;
  organizationId?: string;
  hasProviders?: boolean;
  coordinates?: { lat: number; lng: number };
  maxDistance?: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).name || typeof (value as any).name === 'string') &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).hasProviders || typeof (value as any).hasProviders === 'boolean') &&
    (!(value as any).coordinates || (
      typeof (value as any).coordinates === 'object' &&
      (value as any).coordinates !== null &&
      'lat' in (value as any).coordinates &&
      'lng' in (value as any).coordinates &&
      typeof (value as any).coordinates.lat === 'number' &&
      typeof (value as any).coordinates.lng === 'number'
    )) &&
    (!(value as any).maxDistance || 
      (typeof (value as any).maxDistance === 'number' && (value as any).maxDistance > 0))
  );
}

export function isValidMembershipSearchParams(value: unknown): value is {
  organizationId?: string;
  userId?: string;
  role?: string;
  status?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).userId || isValidUUID((value as any).userId)) &&
    (!(value as any).role || isMembershipRole((value as any).role)) &&
    (!(value as any).status || isMembershipStatus((value as any).status))
  );
}