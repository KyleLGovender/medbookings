import { api } from '@/utils/api';

export function useProviderAssociatedServices(providerId: string | undefined) {
  return api.providers.getProviderAllServices.useQuery(
    { providerId: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}
