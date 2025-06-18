import { useQuery } from '@tanstack/react-query';

import { SerializedServiceProvider } from './types';

/**
 * Hook to fetch provider data
 * @param providerId The ID of the provider to fetch
 * @returns Query result containing the provider data
 */
export function useProvider(providerId: string | undefined) {
  return useQuery<SerializedServiceProvider>({
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
    enabled: !!providerId, // Only run the query if providerId is provided
  });
}
