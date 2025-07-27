import { api } from '@/utils/api';

export function useProviderAssociatedServices(providerId: string | undefined) {
  return api.providers.getProviderServices.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}
