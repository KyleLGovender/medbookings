import { useQuery } from '@tanstack/react-query';

import { api } from '@/utils/api';

/**
 * Hook for fetching requirement types for a provider
 * @param providerId The ID of the provider
 * @returns Query result with requirement types
 */
export function useProviderRequirementTypes(providerId: string | undefined) {
  // First, fetch the provider to get its type ID
  const providerQuery = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Provider not found');
        }
        throw new Error('Failed to fetch provider data');
      }

      return response.json();
    },
    enabled: !!providerId,
  });

  // Then fetch requirements based on the provider type ID
  return api.providers.getRequirementTypes.useQuery(
    undefined,
    {
      enabled: !!providerId && !!providerQuery.data?.providerTypeId,
    }
  );
}
