/**
 * =============================================================================
 * ORGANIZATIONS FEATURE TYPES
 * =============================================================================
 * All type definitions for the organizations feature in one place
 * Domain enums, business logic types, and form schemas only
 */
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
  InvitationStatus,
  MembershipStatus,
  OrganizationBillingModel,
  OrganizationRole,
  OrganizationStatus,
} from '@prisma/client';

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Geographic coordinates for location data
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

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

/**
 * Basic organization information for display and filtering
 * Contains essential organization data used across the application
 *
 * @property {string} id - Unique organization identifier
 * @property {string} name - Organization display name
 * @property {string} [email] - Organization contact email
 * @property {string} [phone] - Organization contact phone
 * @property {string} [website] - Organization website URL
 * @property {OrganizationStatus} status - Organization account status
 * @property {boolean} isActive - Whether organization is currently active
 */
export interface BasicOrganizationInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  status: OrganizationStatus;
  isActive: boolean;
}

/**
 * Organization physical location information
 * Represents a location/branch where an organization operates
 * Includes Google Places integration for address lookup
 *
 * @property {string} [id] - Unique location identifier
 * @property {string} name - Location display name
 * @property {string} [organizationId] - Parent organization identifier
 * @property {string} formattedAddress - Full formatted address string
 * @property {string} [phone] - Location contact phone
 * @property {string} [email] - Location contact email
 * @property {string | Date} [createdAt] - Location creation timestamp
 * @property {string} [googlePlaceId] - Google Places ID for integration
 * @property {any} [coordinates] - Geographic coordinates (lat/lng)
 * @property {string[]} [searchTerms] - Search optimization terms
 */
export interface OrganizationLocation {
  id?: string;
  name: string;
  organizationId?: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  createdAt?: string | Date;
  googlePlaceId?: string;
  coordinates?: Coordinates;
  searchTerms?: string[];
}

// OrganizationProviderConnection moved to server data - use tRPC RouterOutputs

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// Server data interfaces removed - components will use tRPC RouterOutputs

// =============================================================================
// FORM AND INPUT TYPES
// =============================================================================

/**
 * Data structure for creating a new organization
 * Used in organization registration forms and admin creation flows
 */
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
    coordinates?: Coordinates;
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

/**
 * Data structure for creating a new organization location
 * Used when organizations add physical locations/branches
 *
 * @property {string} organizationId - Parent organization
 * @property {string} name - Location name
 * @property {string} formattedAddress - Full address string
 * @property {string} [phone] - Location phone number
 * @property {string} [email] - Location email address
 * @property {string} [googlePlaceId] - Google Places ID
 */
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

/**
 * Location data optimized for create/update/delete operations
 * Contains required fields for database mutations on organization locations
 *
 * @property {string} [id] - Location identifier (for updates/deletes)
 * @property {string} organizationId - Parent organization
 * @property {string} name - Location name
 * @property {string} formattedAddress - Full address string
 * @property {string} [phone] - Location phone
 * @property {string} [email] - Location email
 * @property {string} [googlePlaceId] - Google Places ID
 * @property {any} [coordinates] - Geographic coordinates
 * @property {string[]} [searchTerms] - Search optimization terms
 */
export interface OrganizationLocationForMutation {
  id?: string;
  organizationId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  googlePlaceId?: string;
  coordinates?: Coordinates;
  searchTerms?: string[];
}

// ProviderInvitationWithDetails moved to server data - use tRPC RouterOutputs

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface OrganizationApiResponse<T = unknown> {
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
