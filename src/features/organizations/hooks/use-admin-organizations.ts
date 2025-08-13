'use client';

import { OrganizationStatus } from '@prisma/client';

import { api } from '@/utils/api';

/**
 * Hook for fetching all organizations for admin view
 * @param status Optional status filter for organizations
 * @returns Query result with organizations list
 */
export function useAdminOrganizations(status?: OrganizationStatus) {
  return api.admin.getOrganizations.useQuery({ status });
}

/**
 * Hook for fetching a specific organization for admin view
 * @param organizationId The ID of the organization to fetch
 * @returns Query result with organization details
 */
export function useAdminOrganization(organizationId: string | undefined) {
  return api.admin.getOrganizationById.useQuery(
    { id: organizationId || '' },
    {
      enabled: !!organizationId,
    }
  );
}

/**
 * Hook for fetching organizations by status with counts for dashboard
 * @returns Query result with organization counts by status
 */
export function useAdminOrganizationCounts() {
  return api.admin.getOrganizations.useQuery(
    {},
    {
      select: (organizations) => {
        // Calculate counts by status
        const counts = organizations.reduce(
          (acc: Record<string, number>, organization: any) => {
            const status = organization.status || OrganizationStatus.PENDING_APPROVAL;
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

          return acc;
        }, {});

        return {
          ...counts,
          metrics,
        };
      },
    }
  );
}

/**
 * Hook for fetching organizations pending approval
 * @returns Query result with organizations that are pending approval
 */
export function useAdminOrganizationsPendingApproval() {
  return api.admin.getOrganizations.useQuery({ status: OrganizationStatus.PENDING_APPROVAL });
}

/**
 * Hook for fetching organizations with specific criteria for admin review
 * @returns Query result with organizations that need admin attention
 */
export function useAdminOrganizationsNeedingReview() {
  return api.admin.getOrganizations.useQuery(
    {},
    {
      select: (organizations) => {
        // Filter organizations that need review
        return organizations.filter((organization: any) => {
          // Organizations that are pending
          if (organization.status === OrganizationStatus.PENDING_APPROVAL) return true;

          // Organizations with no members (potential issues)
          if (!organization.memberships || organization.memberships.length === 0) return true;

          // Organizations with no locations (incomplete setup)
          if (!organization.locations || organization.locations.length === 0) return true;

          return false;
        });
      },
    }
  );
}

/**
 * Hook for fetching recently approved organizations
 * @param days Number of days to look back (default: 30)
 * @returns Query result with recently approved organizations
 */
export function useAdminRecentlyApprovedOrganizations(days: number = 30) {
  return api.admin.getOrganizations.useQuery(
    { status: OrganizationStatus.APPROVED },
    {
      select: (organizations) => {
        // Filter organizations approved within the specified days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return organizations.filter((organization: any) => {
          if (!organization.approvedAt) return false;
          const approvedDate = new Date(organization.approvedAt);
          return approvedDate >= cutoffDate;
        });
      },
    }
  );
}
