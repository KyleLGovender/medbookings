import { useQuery } from '@tanstack/react-query';

import { SerializedServiceProvider } from '@/features/providers/types/types';

/**
 * Hook to fetch a provider by user ID
 * @param userId The ID of the user to fetch the provider for
 * @returns Query result containing the provider data or null if not found
 */
export function useProviderByUserId(userId: string | undefined) {
  return useQuery<SerializedServiceProvider | null>({
    queryKey: ['providerByUserId', userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        const response = await fetch(`/api/providers/user/${userId}`);

        if (response.status === 404) {
          // Not found means the user is not a service provider
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch service provider');
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching service provider by user ID:', error);
        throw error;
      }
    },
    // Don't retry if 404 (user doesn't have a provider account)
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    // Skip if no userId is provided
    enabled: !!userId,
  });
}
