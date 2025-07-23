// =============================================================================
// ADMIN FEATURE TYPES
// =============================================================================
// All type definitions for the admin feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types

import { Prisma } from '@prisma/client';

// =============================================================================
// ENUMS
// =============================================================================

export enum AdminAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
}

export enum ApprovalEntityType {
  PROVIDER = 'PROVIDER',
  ORGANIZATION = 'ORGANIZATION',
  REQUIREMENT = 'REQUIREMENT',
}

export enum AdminApprovalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AdminProviderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TRIAL = 'TRIAL',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  ACTIVE = 'ACTIVE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum AdminOrganizationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TRIAL = 'TRIAL',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  ACTIVE = 'ACTIVE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum RequirementValidationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// =============================================================================
// BASE INTERFACES AND TYPES
// =============================================================================

// Basic Admin Action Types
export type AdminActionType = 'APPROVE' | 'REJECT' | 'SUSPEND';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

// API Response Types
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminApiErrorResponse {
  error: string;
  unapprovedRequirements?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

// Request Body Types
export interface ApproveProviderRequest {
  // Currently no additional data needed
}

export interface RejectProviderRequest {
  reason: string;
}

export interface ApproveOrganizationRequest {
  // Currently no additional data needed
}

export interface RejectOrganizationRequest {
  reason: string;
}

export interface ApproveRequirementRequest {
  // Currently no additional data needed
}

export interface RejectRequirementRequest {
  reason: string;
}

// Form Data Types
export interface RejectionFormData {
  reason: string;
}

export interface ApprovalFormData {
  // Currently empty but typed for future extensions
}

// Server Action Result Types
export interface ServerActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ApproveProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type SuspendProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type DeleteProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type RejectProviderAction = (
  providerId: string,
  reason: string
) => Promise<ServerActionResult>;
export type ApproveOrganizationAction = (organizationId: string) => Promise<ServerActionResult>;
export type RejectOrganizationAction = (
  organizationId: string,
  reason: string
) => Promise<ServerActionResult>;
export type ApproveRequirementAction = (requirementId: string) => Promise<ServerActionResult>;
export type RejectRequirementAction = (
  requirementId: string,
  reason: string
) => Promise<ServerActionResult>;

// Dashboard Data Types
export interface AdminProviderCounts {
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

export interface AdminOrganizationCounts {
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

export interface AdminDashboardData {
  providerCounts: AdminProviderCounts;
  organizationCounts: AdminOrganizationCounts;
}

// List Filter Types
export interface AdminListFilters {
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  search?: string;
}

// Route Parameter Types
export interface AdminRouteParams {
  id: string;
}

export interface AdminRequirementRouteParams {
  id: string;
  requirementId: string;
}

export interface AdminSearchParams {
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

// Page Props Types
export interface AdminProvidersPageProps {
  searchParams: AdminSearchParams;
}

export interface AdminProviderDetailPageProps {
  params: AdminRouteParams;
}

export interface AdminOrganizationsPageProps {
  searchParams: AdminSearchParams;
}

export interface AdminOrganizationDetailPageProps {
  params: AdminRouteParams;
}

// Prisma Select Types for Admin Queries
export type AdminOrganizationSelect = Prisma.OrganizationGetPayload<{
  include: {
    approvedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    memberships: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    locations: {
      select: {
        id: true;
        name: true;
        formattedAddress: true;
        phone: true;
        email: true;
        createdAt: true;
        googlePlaceId: true;
      };
    };
    providerConnections: {
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
                phone: true;
              };
            };
            typeAssignments: {
              include: {
                providerType: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    _count: {
      select: {
        memberships: true;
        locations: true;
        providerConnections: true;
      };
    };
  };
}>;

export type AdminProviderSelect = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        whatsapp: true;
      };
    };
    typeAssignments: {
      include: {
        providerType: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    services: {
      select: {
        id: true;
        name: true;
      };
    };
    requirementSubmissions: {
      include: {
        requirementType: {
          select: {
            id: true;
            name: true;
            displayPriority: true;
            isRequired: true;
          };
        };
        validatedBy: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    approvedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type AdminProviderListSelect = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    typeAssignments: {
      include: {
        providerType: {
          select: {
            name: true;
          };
        };
      };
    };
    requirementSubmissions: {
      select: {
        status: true;
      };
    };
  };
}>;

export type AdminOrganizationListSelect = Prisma.OrganizationGetPayload<{
  include: {
    _count: {
      select: {
        memberships: true;
        locations: true;
      };
    };
  };
}>;

// Component-Specific Types
export interface AdminRequirementSubmission {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  validatedAt?: string;
  requirementType: {
    id: string;
    name: string;
    displayPriority?: number;
    isRequired: boolean;
  };
  validatedBy?: {
    id: string;
    name: string;
  };
}

export interface OrganizationMembership {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
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

// Component Props Types
export interface AdminProviderDetailProps {
  provider: AdminProviderSelect;
}

export interface AdminOrganizationDetailProps {
  organization: AdminOrganizationSelect;
}

export interface AdminProviderListProps {
  providers: AdminProviderListSelect[];
  initialStatus?: string;
}

export interface AdminOrganizationListProps {
  organizations: AdminOrganizationListSelect[];
  initialStatus?: string;
}

export interface ApprovalButtonsProps {
  entityType: ApprovalEntityType;
  entityId: string;
  currentStatus: ApprovalStatus;
  onApprove?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}

export interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  entityType: ApprovalEntityType;
  entityName?: string;
  isLoading?: boolean;
}

// =============================================================================
// HOOK INTERFACES (consolidated from interfaces.ts)
// =============================================================================

// Hook interfaces for TanStack Query
export interface UseAdminProvidersResult {
  data: AdminProviderSelect[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAdminOrganizationsResult {
  data: AdminOrganizationSelect[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAdminProviderResult {
  data: AdminProviderSelect | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAdminOrganizationResult {
  data: AdminOrganizationSelect | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mutation interfaces
export interface AdminMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseApproveProviderMutation {
  mutate: (providerId: string) => void;
  mutateAsync: (providerId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseRejectProviderMutation {
  mutate: (data: { providerId: string; reason: string }) => void;
  mutateAsync: (data: { providerId: string; reason: string }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseApproveOrganizationMutation {
  mutate: (organizationId: string) => void;
  mutateAsync: (organizationId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseRejectOrganizationMutation {
  mutate: (data: { organizationId: string; reason: string }) => void;
  mutateAsync: (data: { organizationId: string; reason: string }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseApproveRequirementMutation {
  mutate: (data: { providerId: string; requirementId: string }) => void;
  mutateAsync: (data: { providerId: string; requirementId: string }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseRejectRequirementMutation {
  mutate: (data: { providerId: string; requirementId: string; reason: string }) => void;
  mutateAsync: (data: {
    providerId: string;
    requirementId: string;
    reason: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// Count interfaces
export interface UseAdminProviderCountsResult {
  data:
    | {
        PENDING_APPROVAL: number;
        APPROVED: number;
        REJECTED: number;
        total: number;
      }
    | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface UseAdminOrganizationCountsResult {
  data:
    | {
        PENDING_APPROVAL: number;
        APPROVED: number;
        REJECTED: number;
        total: number;
      }
    | undefined;
  isLoading: boolean;
  error: Error | null;
}

// API client interfaces
export interface AdminApiClient {
  providers: {
    list: (filters?: { status?: string }) => Promise<AdminProviderSelect[]>;
    get: (id: string) => Promise<AdminProviderSelect>;
    approve: (id: string) => Promise<void>;
    reject: (id: string, reason: string) => Promise<void>;
    counts: () => Promise<{
      PENDING_APPROVAL: number;
      APPROVED: number;
      REJECTED: number;
      total: number;
    }>;
  };
  organizations: {
    list: (filters?: { status?: string }) => Promise<AdminOrganizationSelect[]>;
    get: (id: string) => Promise<AdminOrganizationSelect>;
    approve: (id: string) => Promise<void>;
    reject: (id: string, reason: string) => Promise<void>;
    counts: () => Promise<{
      PENDING_APPROVAL: number;
      APPROVED: number;
      REJECTED: number;
      total: number;
    }>;
  };
  requirements: {
    approve: (providerId: string, requirementId: string) => Promise<void>;
    reject: (providerId: string, requirementId: string, reason: string) => Promise<void>;
  };
}
