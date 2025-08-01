import { useQueries } from '@tanstack/react-query';

import { api } from '@/utils/api';

/**
 * Hook to fetch locations for multiple organizations
 * @param organizationIds Array of organization IDs
 * @returns Query result containing all locations from the specified organizations
 */
export function useOrganizationLocations(organizationIds: string[]) {
  const utils = api.useUtils();

  const locationQueries = useQueries({
    queries: organizationIds.map((orgId) => ({
      queryKey: ['organizations', 'locations', orgId],
      queryFn: () => utils.organizations.getLocations.fetch({ organizationId: orgId }),
      enabled: !!orgId,
    })),
  });

  // Combine all locations into a single array
  const allLocations = locationQueries
    .flatMap((query) => query.data || [])
    .map((location, index) => ({
      ...location,
      organizationId: organizationIds[Math.floor(index / (locationQueries[0]?.data?.length || 1))],
    }));

  const isLoading = locationQueries.some((query) => query.isLoading);
  const isError = locationQueries.some((query) => query.isError);

  return {
    data: allLocations,
    isLoading,
    isError,
  };
}
