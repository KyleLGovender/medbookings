// =============================================================================
// ORGANIZATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the organizations feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  Organization,
  OrganizationMembership,
  OrganizationProviderConnection,
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

export interface OrganizationLocation {
  id: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  email?: string;
  createdAt: string;
  googlePlaceId?: string;
}

export interface OrganizationProviderConnection {
  id: string;
  createdAt: string;
  provider: {
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    typeAssignments: {
      providerType: {
        name: string;
      };
    }[];
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