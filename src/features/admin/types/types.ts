import { Prisma } from '@prisma/client';

// Basic Admin Action Types
export type AdminActionType = 'APPROVE' | 'REJECT' | 'SUSPEND';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type ApprovalEntityType = 'PROVIDER' | 'ORGANIZATION' | 'REQUIREMENT';

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

export type ApproveServiceProviderAction = (
  serviceProviderId: string
) => Promise<ServerActionResult>;
export type SuspendServiceProviderAction = (
  serviceProviderId: string
) => Promise<ServerActionResult>;
export type DeleteServiceProviderAction = (
  serviceProviderId: string
) => Promise<ServerActionResult>;
export type RejectServiceProviderAction = (
  serviceProviderId: string,
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
        serviceProvider: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
                phone: true;
              };
            };
            serviceProviderType: {
              select: {
                name: true;
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

export type AdminProviderSelect = Prisma.ServiceProviderGetPayload<{
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
    serviceProviderType: {
      select: {
        id: true;
        name: true;
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

export type AdminProviderListSelect = Prisma.ServiceProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    serviceProviderType: {
      select: {
        name: true;
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
  serviceProvider: {
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    serviceProviderType: {
      name: string;
    };
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
