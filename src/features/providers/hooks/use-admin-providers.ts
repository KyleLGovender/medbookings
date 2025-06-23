'use client';

import { ServiceProviderStatus } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for fetching all providers for admin view
 * @param status Optional status filter for providers
 * @returns Query result with providers list
 */
export function useAdminProviders(status?: ServiceProviderStatus) {
  return useQuery({
    queryKey: ['admin', 'providers', status],
    queryFn: async () => {
      const url = new URL('/api/admin/providers', window.location.origin);

      if (status) {
        url.searchParams.append('status', status);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch providers');
      }

      return response.json();
    },
  });
}

/**
 * Hook for fetching a specific provider for admin view
 * @param providerId The ID of the provider to fetch
 * @returns Query result with provider details
 */
export function useAdminProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'provider', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/admin/providers/${providerId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        if (response.status === 404) {
          throw new Error('Provider not found');
        }
        throw new Error('Failed to fetch provider');
      }

      return response.json();
    },
    enabled: !!providerId,
  });
}

/**
 * Hook for fetching providers by status with counts for dashboard
 * @returns Query result with provider counts by status
 */
export function useAdminProviderCounts() {
  return useQuery({
    queryKey: ['admin', 'provider-counts'],
    queryFn: async () => {
      // Fetch all providers and calculate counts client-side
      // This could be optimized with a dedicated API endpoint for counts
      const response = await fetch('/api/admin/providers');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch providers');
      }

      const providers = await response.json();

      // Calculate counts by status
      const counts = providers.reduce(
        (acc: Record<string, number>, provider: any) => {
          const status = provider.status || 'PENDING';
          acc[status] = (acc[status] || 0) + 1;
          acc.total = (acc.total || 0) + 1;
          return acc;
        },
        { total: 0 }
      );

      // Calculate requirement-based counts
      const requirementCounts = providers.reduce((acc: Record<string, number>, provider: any) => {
        const requiredSubmissions =
          provider.requirementSubmissions?.filter((sub: any) => sub.requirementType?.isRequired) ||
          [];

        const approvedRequired = requiredSubmissions.filter(
          (sub: any) => sub.status === 'APPROVED'
        ).length;

        const totalRequired = requiredSubmissions.length;

        if (totalRequired === 0) {
          acc.noRequirements = (acc.noRequirements || 0) + 1;
        } else if (approvedRequired === totalRequired) {
          acc.allRequirementsApproved = (acc.allRequirementsApproved || 0) + 1;
        } else {
          acc.pendingRequirements = (acc.pendingRequirements || 0) + 1;
        }

        return acc;
      }, {});

      return {
        ...counts,
        requirements: requirementCounts,
      };
    },
  });
}

/**
 * Hook for fetching providers with pending requirements
 * @returns Query result with providers that have pending requirements
 */
export function useAdminProvidersWithPendingRequirements() {
  return useQuery({
    queryKey: ['admin', 'providers-pending-requirements'],
    queryFn: async () => {
      const response = await fetch('/api/admin/providers');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch providers');
      }

      const providers = await response.json();

      // Filter providers with pending requirements
      return providers.filter((provider: any) => {
        const requiredSubmissions =
          provider.requirementSubmissions?.filter((sub: any) => sub.requirementType?.isRequired) ||
          [];

        const approvedRequired = requiredSubmissions.filter(
          (sub: any) => sub.status === 'APPROVED'
        ).length;

        const totalRequired = requiredSubmissions.length;

        // Has requirements and not all are approved
        return totalRequired > 0 && approvedRequired < totalRequired;
      });
    },
  });
}

/**
 * Hook for fetching providers ready for approval (all requirements approved)
 * @returns Query result with providers ready for final approval
 */
export function useAdminProvidersReadyForApproval() {
  return useQuery({
    queryKey: ['admin', 'providers-ready-for-approval'],
    queryFn: async () => {
      const response = await fetch('/api/admin/providers');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch providers');
      }

      const providers = await response.json();

      // Filter providers ready for approval
      return providers.filter((provider: any) => {
        // Only consider providers that are still pending
        if (provider.status !== 'PENDING') return false;

        const requiredSubmissions =
          provider.requirementSubmissions?.filter((sub: any) => sub.requirementType?.isRequired) ||
          [];

        const approvedRequired = requiredSubmissions.filter(
          (sub: any) => sub.status === 'APPROVED'
        ).length;

        const totalRequired = requiredSubmissions.length;

        // Has requirements and all are approved, or has no requirements
        return totalRequired === 0 || approvedRequired === totalRequired;
      });
    },
  });
}
