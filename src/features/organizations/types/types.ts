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
// PRISMA ENUM IMPORTS
// =============================================================================

import {
  OrganizationStatus,
  OrganizationRole,
  OrganizationBillingModel,
  MembershipStatus,
  InvitationStatus,
} from '@prisma/client';

// =============================================================================
// DOMAIN ENUMS - CLIENT-ONLY BUSINESS LOGIC
// =============================================================================

// Domain-specific enum for UI actions (not in Prisma)
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
    billingModel: OrganizationBillingModel;
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
  role: OrganizationRole;
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

// Utility types - import specific Prisma types where needed
// Example: import type { OrganizationStatus } from '@prisma/client'

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
