'use client';

import { api } from '@/utils/api';

/**
 * Hook for fetching all providers for admin view
 * @param status Optional status filter for providers
 * @returns Query result with providers list
 */
export function useAdminProviders(status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') {
  return api.admin.getProviders.useQuery({ status });
}

/**
 * Hook for fetching a specific provider basic info for admin view
 * @param providerId The ID of the provider to fetch
 * @returns Query result with provider basic details (no requirements)
 */
export function useAdminProvider(providerId: string | undefined) {
  return api.admin.getProviderById.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}

/**
 * Hook for fetching provider requirement submissions (admin view)
 * Separate from basic provider info for better performance
 * @param providerId The ID of the provider
 * @returns Query result with requirement submissions only
 */
export function useAdminProviderRequirements(providerId: string | undefined) {
  return api.admin.getProviderRequirements.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}

/**
 * Hook for fetching providers by status with counts for dashboard
 * @returns Query result with provider counts by status
 */
export function useAdminProviderCounts() {
  return api.admin.getProviders.useQuery(
    {},
    {
      select: (providers) => {
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
        // Note: Basic getProviders query only includes requirementSubmissions.status
        // For detailed requirement analysis, use getProviderRequirements
        const requirementCounts = providers.reduce((acc: Record<string, number>, provider: any) => {
          const submissions = provider.requirementSubmissions || [];

          const approvedCount = submissions.filter(
            (sub: any) => sub.status === 'APPROVED'
          ).length;

          const totalCount = submissions.length;

          if (totalCount === 0) {
            acc.noRequirements = (acc.noRequirements || 0) + 1;
          } else if (approvedCount === totalCount) {
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
    }
  );
}

/**
 * Hook for fetching providers with pending requirements
 * @returns Query result with providers that have pending requirements
 */
export function useAdminProvidersWithPendingRequirements() {
  return api.admin.getProviders.useQuery(
    {},
    {
      select: (providers) => {
        // Filter providers with pending requirements
        // Note: Using all submissions since requirementType.isRequired is not available in basic query
        return providers.filter((provider: any) => {
          const submissions = provider.requirementSubmissions || [];

          const approvedCount = submissions.filter(
            (sub: any) => sub.status === 'APPROVED'
          ).length;

          const totalCount = submissions.length;

          // Has requirements and not all are approved
          return totalCount > 0 && approvedCount < totalCount;
        });
      },
    }
  );
}

/**
 * Hook for fetching providers ready for approval (all requirements approved)
 * @returns Query result with providers ready for final approval
 */
export function useAdminProvidersReadyForApproval() {
  return api.admin.getProviders.useQuery(
    {},
    {
      select: (providers) => {
        // Filter providers ready for approval
        return providers.filter((provider: any) => {
          // Only consider providers that are still pending
          if (provider.status !== 'PENDING_APPROVAL') return false;

          const submissions = provider.requirementSubmissions || [];

          const approvedCount = submissions.filter(
            (sub: any) => sub.status === 'APPROVED'
          ).length;

          const totalCount = submissions.length;

          // Has requirements and all are approved, or has no requirements
          return totalCount === 0 || approvedCount === totalCount;
        });
      },
    }
  );
}
