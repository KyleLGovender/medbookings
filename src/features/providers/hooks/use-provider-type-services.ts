import { useQuery } from '@tanstack/react-query';

import { api } from '@/utils/api';

/**
 * Hook to fetch available services for a provider
 * @param providerId The ID of the provider
 * @returns Query result containing the available services
 */
export function useProviderTypeServices(providerId: string | undefined) {
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

  // Then fetch services based on the provider type ID
  return api.providers.getServices.useQuery(
    {
      providerTypeId: providerQuery.data?.providerTypeId || '',
      providerId: providerId,
    },
    {
      enabled: !!providerId && !!providerQuery.data?.providerTypeId,
    }
  );
}
