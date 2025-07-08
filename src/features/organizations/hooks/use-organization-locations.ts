import { useQuery } from '@tanstack/react-query';

export interface OrganizationLocation {
  id: string;
  name: string;
  organizationId: string;
  [key: string]: any; // Allow other properties from the API response
}

/**
 * Hook to fetch locations for multiple organizations
 * @param organizationIds Array of organization IDs
 * @returns Query result containing all locations from the specified organizations
 */
export function useOrganizationLocations(organizationIds: string[]) {
  return useQuery<OrganizationLocation[]>({
    queryKey: ['organization-locations', organizationIds],
    queryFn: async () => {
      if (organizationIds.length === 0) return [];

      const allLocations = await Promise.all(
        organizationIds.map(async (orgId) => {
          const response = await fetch(`/api/organizations/${orgId}/locations`);
          if (!response.ok) return [];
          const locations = await response.json();
          return locations.map((location: any) => ({
            ...location,
            organizationId: orgId,
          }));
        })
      );

      return allLocations.flat();
    },
    enabled: organizationIds.length > 0,
  });
}
