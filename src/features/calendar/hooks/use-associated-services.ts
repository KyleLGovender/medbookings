import { api } from '@/utils/api';

/**
 * Hook for fetching provider's associated services (calendar feature)
 * @param providerId The ID of the provider
 * @returns Query result with provider's services
 */
export function useAssociatedServices(providerId: string | undefined) {
  return api.providers.getProviderAllServices.useQuery(
    { providerId: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}
