import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number | null;
  defaultPrice?: number | null;
  isSelected?: boolean;
  displayPriority?: number;
}

/**
 * Hook to fetch available services for a provider
 * @param providerId The ID of the provider
 * @returns Query result containing the available services
 */
export function useProviderServices(providerId: string | undefined) {
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
  return useQuery<Service[]>({
    queryKey: ['provider-services', providerId, providerQuery.data?.serviceProviderTypeId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      // providerId
      const url = new URL('/api/providers/services', window.location.origin);
      url.searchParams.append('providerId', providerId);

      // providerTypeId
      if (providerQuery.data?.serviceProviderTypeId) {
        url.searchParams.append('providerTypeId', providerQuery.data.serviceProviderTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!providerId && !!providerQuery.data?.serviceProviderTypeId,
  });
}
