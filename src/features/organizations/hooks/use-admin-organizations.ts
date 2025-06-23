'use client';

import { OrganizationStatus } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for fetching all organizations for admin view
 * @param status Optional status filter for organizations
 * @returns Query result with organizations list
 */
export function useAdminOrganizations(status?: OrganizationStatus) {
  return useQuery({
    queryKey: ['admin', 'organizations', status],
    queryFn: async () => {
      const url = new URL('/api/admin/organizations', window.location.origin);

      if (status) {
        url.searchParams.append('status', status);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch organizations');
      }

      return response.json();
    },
  });
}

/**
 * Hook for fetching a specific organization for admin view
 * @param organizationId The ID of the organization to fetch
 * @returns Query result with organization details
 */
export function useAdminOrganization(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/admin/organizations/${organizationId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        if (response.status === 404) {
          throw new Error('Organization not found');
        }
        throw new Error('Failed to fetch organization');
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook for fetching organizations by status with counts for dashboard
 * @returns Query result with organization counts by status
 */
export function useAdminOrganizationCounts() {
  return useQuery({
    queryKey: ['admin', 'organization-counts'],
    queryFn: async () => {
      // Fetch all organizations and calculate counts client-side
      // This could be optimized with a dedicated API endpoint for counts
      const response = await fetch('/api/admin/organizations');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch organizations');
      }

      const organizations = await response.json();

      // Calculate counts by status
      const counts = organizations.reduce(
        (acc: Record<string, number>, organization: any) => {
          const status = organization.status || 'PENDING';
          acc[status] = (acc[status] || 0) + 1;
          acc.total = (acc.total || 0) + 1;
          return acc;
        },
        { total: 0 }
      );

      // Calculate additional metrics
      const metrics = organizations.reduce((acc: Record<string, number>, organization: any) => {
        // Count organizations with members
        if (organization.memberships && organization.memberships.length > 0) {
          acc.withMembers = (acc.withMembers || 0) + 1;
        } else {
          acc.withoutMembers = (acc.withoutMembers || 0) + 1;
        }

        // Count organizations with locations
        if (organization.locations && organization.locations.length > 0) {
          acc.withLocations = (acc.withLocations || 0) + 1;
        } else {
          acc.withoutLocations = (acc.withoutLocations || 0) + 1;
        }

        // Count organizations with provider connections
        if (organization._count?.providerConnections > 0) {
          acc.withProviders = (acc.withProviders || 0) + 1;
        } else {
          acc.withoutProviders = (acc.withoutProviders || 0) + 1;
        }

        return acc;
      }, {});

      return {
        ...counts,
        metrics,
      };
    },
  });
}

/**
 * Hook for fetching organizations pending approval
 * @returns Query result with organizations that are pending approval
 */
export function useAdminOrganizationsPendingApproval() {
  return useQuery({
    queryKey: ['admin', 'organizations-pending-approval'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations?status=PENDING');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch organizations');
      }

      return response.json();
    },
  });
}

/**
 * Hook for fetching organizations with specific criteria for admin review
 * @returns Query result with organizations that need admin attention
 */
export function useAdminOrganizationsNeedingReview() {
  return useQuery({
    queryKey: ['admin', 'organizations-needing-review'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch organizations');
      }

      const organizations = await response.json();

      // Filter organizations that need review
      return organizations.filter((organization: any) => {
        // Organizations that are pending
        if (organization.status === 'PENDING') return true;

        // Organizations with no members (potential issues)
        if (!organization.memberships || organization.memberships.length === 0) return true;

        // Organizations with no locations (incomplete setup)
        if (!organization.locations || organization.locations.length === 0) return true;

        return false;
      });
    },
  });
}

/**
 * Hook for fetching recently approved organizations
 * @param days Number of days to look back (default: 30)
 * @returns Query result with recently approved organizations
 */
export function useAdminRecentlyApprovedOrganizations(days: number = 30) {
  return useQuery({
    queryKey: ['admin', 'organizations-recently-approved', days],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations?status=APPROVED');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error('Failed to fetch organizations');
      }

      const organizations = await response.json();

      // Filter organizations approved within the specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return organizations.filter((organization: any) => {
        if (!organization.approvedAt) return false;
        const approvedDate = new Date(organization.approvedAt);
        return approvedDate >= cutoffDate;
      });
    },
  });
}
