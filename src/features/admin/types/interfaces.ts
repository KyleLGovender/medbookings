import { AdminOrganizationSelect, AdminProviderSelect } from './types';

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
