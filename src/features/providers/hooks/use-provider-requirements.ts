import { useQuery } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['providerRequirementTypes', providerId, providerQuery.data?.serviceProviderTypeId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      // providerId
      const url = new URL('/api/providers/requirement-types', window.location.origin);
      url.searchParams.append('providerId', providerId);

      // providerTypeId
      if (providerQuery.data?.serviceProviderTypeId) {
        url.searchParams.append('providerTypeId', providerQuery.data.serviceProviderTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch requirement types');
      }

      return response.json();
    },
    enabled: !!providerId && !!providerQuery.data?.serviceProviderTypeId,
  });
}
