'use client';

import { api } from '@/utils/api';

/**
 * Hook to get locations for specified organizations (calendar feature)
 * @param organizationIds Array of organization IDs to fetch locations for
 * @returns Query result with locations from all specified organizations
 */
export function useOrganizationLocations(organizationIds: string[]) {
  return api.organizations.getLocations.useQuery(
    { organizationIds },
    {
      enabled: organizationIds.length > 0,
    }
  );
}
