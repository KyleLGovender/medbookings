import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch organization data
 * @param organizationId The ID of the organization to fetch
 * @returns Query result containing the organization data
 */
export function useOrganization(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Organization not found');
        }
        throw new Error('Failed to fetch organization data');
      }

      return response.json();
    },
    enabled: !!organizationId, // Only run the query if organizationId is provided
  });
}
