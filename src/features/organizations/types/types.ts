// =============================================================================
// ORGANIZATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the organizations feature in one place
// Domain enums, business logic types, and form schemas only
//
// =============================================================================
// MIGRATION NOTES - SERVER DATA REMOVED
// =============================================================================
//
// Removed server data:
// - All Prisma imports and derived types
// - OrganizationWithRelations interface
// - All Prisma select/include configurations
// - All Prisma GetPayload types (OrganizationDetailSelect, etc.)
//
// Components will use tRPC RouterOutputs for server data in Task 4.0

// =============================================================================
// ENUMS
// =============================================================================

// Organization-related enums (matching Prisma schema)
export enum OrganizationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum MembershipRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProviderInvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum InvitationAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  RESEND = 'RESEND',
}

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Organization-related base interfaces
export interface BasicOrganizationInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  status: OrganizationStatus;
  isActive: boolean;
}

// Types moved from hooks files
export interface OrganizationLocation {
  id?: string;
  name: string;
  organizationId?: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  createdAt?: string | Date;
  googlePlaceId?: string;
  coordinates?: any;
  searchTerms?: string[];
  [key: string]: any; // Allow other properties from the API response
}

// OrganizationProviderConnection moved to server data - use tRPC RouterOutputs

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// Server data interfaces removed - components will use tRPC RouterOutputs

// =============================================================================
// FORM AND INPUT TYPES
// =============================================================================

export interface CreateOrganizationData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
}

// Alias for backward compatibility
export type OrganizationBasicInfoData = CreateOrganizationData;

export interface OrganizationRegistrationData {
  organization: CreateOrganizationData & {
    billingModel: 'CONSOLIDATED' | 'SLOT_BASED';
    logo?: string;
  };
  locations?: Array<{
    id?: string;
    name: string;
    formattedAddress: string;
    phone?: string;
    email?: string;
    googlePlaceId?: string;
    coordinates?: any;
    searchTerms?: string[];
  }>;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

export interface CreateMembershipData {
  organizationId: string;
  userId: string;
  role: MembershipRole;
}

export interface CreateLocationData {
  organizationId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
}

export interface OrganizationLocationsData {
  locations: OrganizationLocation[];
}

// Location with required fields for mutation operations
export interface OrganizationLocationForMutation {
  id?: string;
  organizationId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
  coordinates?: any;
  searchTerms?: string[];
}

// ProviderInvitationWithDetails moved to server data - use tRPC RouterOutputs

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface OrganizationApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type OrganizationStatusType = keyof typeof OrganizationStatus;
export type MembershipRoleType = keyof typeof MembershipRole;
export type MembershipStatusType = keyof typeof MembershipStatus;

// =============================================================================
// PRISMA CONFIGURATIONS REMOVED
// =============================================================================
//
// Prisma include/select configurations moved to server actions.
// tRPC procedures will handle data fetching patterns in server layer.

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const getDefaultOrganizationData = (): Partial<CreateOrganizationData> => ({
  name: '',
  email: '',
  phone: '',
  website: '',
  description: '',
});

// =============================================================================
// PRISMA-DERIVED TYPES REMOVED
// =============================================================================
//
// All Prisma GetPayload types removed:
// - OrganizationDetailSelect → Use RouterOutputs['organizations']['getOrganizationDetail']
// - OrganizationListSelect → Use RouterOutputs['organizations']['getOrganizations']
// - OrganizationBasicSelect → Use RouterOutputs['organizations']['getOrganizationBasic']
// - LocationDetailSelect → Use RouterOutputs['organizations']['getLocationDetail']
// - MembershipDetailSelect → Use RouterOutputs['organizations']['getMembershipDetail']
// - ProviderConnectionDetailSelect → Use RouterOutputs['organizations']['getProviderConnectionDetail']
//
// Components will extract types directly from tRPC RouterOutputs in Task 4.0
