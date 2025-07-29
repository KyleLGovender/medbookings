import { api } from '@/utils/api';

/**
 * Hook to fetch a provider by user ID
 * @param userId The ID of the user to fetch the provider for
 * @returns Query result containing the provider data or null if not found
 */
export function useProviderByUserId(userId: string | undefined) {
  return api.providers.getByUserId.useQuery(
    { userId: userId! },
    {
      // Skip if no userId is provided
      enabled: !!userId,
      retry: false, // Don't retry since 404 is expected when user isn't a provider
    }
  );
}
