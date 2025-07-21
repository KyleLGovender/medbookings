import { useQuery } from '@tanstack/react-query';

import { SerializedService } from '@/features/providers/hooks/types';

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
  return useQuery<SerializedService[]>({
    queryKey: ['provider-services', providerId, providerQuery.data?.providerTypeId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      // providerId
      const url = new URL('/api/providers/services', window.location.origin);
      url.searchParams.append('providerId', providerId);

      // providerTypeId
      if (providerQuery.data?.providerTypeId) {
        url.searchParams.append('providerTypeId', providerQuery.data.providerTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!providerId && !!providerQuery.data?.providerTypeId,
  });
}
