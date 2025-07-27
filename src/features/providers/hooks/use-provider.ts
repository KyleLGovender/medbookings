import { api } from '@/utils/api';

/**
 * Hook to fetch provider data
 * @param providerId The ID of the provider to fetch
 * @returns Query result containing the provider data
 */
export function useProvider(providerId: string | undefined) {
  return api.providers.getById.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
    }
  );
}
