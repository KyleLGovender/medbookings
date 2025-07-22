// =============================================================================
// ORGANIZATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the organizations feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  Organization,
  OrganizationMembership,
  User,
} from '@prisma/client';

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
  formattedAddress?: string;
  phone?: string;
  email?: string;
  createdAt?: string | Date;
  googlePlaceId?: string;
  coordinates?: any;
  searchTerms?: string[];
  [key: string]: any; // Allow other properties from the API response
}

export interface OrganizationProviderConnection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUSPENDED';
  acceptedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  serviceProvider: {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    website: string | null;
    bio: string | null;
    image: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    serviceProviderType: {
      id: string;
      name: string;
      description: string | null;
    } | null;
  };
  invitation?: {
    id: string;
    [key: string]: any;
  };
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// Organization with full relations
export interface OrganizationWithRelations extends Organization {
  approvedBy?: User;
  memberships: Array<{
    id: string;
    role: MembershipRole;
    status: MembershipStatus;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  locations: OrganizationLocation[];
  providerConnections: OrganizationProviderConnection[];
  _count?: {
    memberships: number;
    locations: number;
    providerConnections: number;
  };
}

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

export interface OrganizationRegistrationData extends CreateOrganizationData {
  termsAccepted: boolean;
  billingType?: 'monthly' | 'yearly';
  [key: string]: any; // Allow additional registration fields
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

export interface ProviderInvitationWithDetails {
  id: string;
  email: string;
  status: ProviderInvitationStatus;
  customMessage?: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  acceptedAt?: string | Date;
  rejectedAt?: string | Date;
  cancelledAt?: string | Date;
  organization: {
    id: string;
    name: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
  };
  connection?: {
    providerId: string;
    status: string;
    [key: string]: any;
  };
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

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
// PRISMA INCLUDE CONFIGURATIONS
// =============================================================================

// Helper configuration for including organization relations
export const includeOrganizationRelations = {
  approvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  memberships: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  locations: {
    select: {
      id: true,
      name: true,
      formattedAddress: true,
      phone: true,
      email: true,
      createdAt: true,
      googlePlaceId: true,
    },
  },
  providerConnections: {
    include: {
      provider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          typeAssignments: {
            include: {
              providerType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      memberships: true,
      locations: true,
      providerConnections: true,
    },
  },
};

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