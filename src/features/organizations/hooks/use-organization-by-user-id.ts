import { api } from '@/utils/api';

/**
 * Hook to fetch organizations by user ID
 * @param userId The ID of the user to fetch organizations for
 * @returns Query result containing the organizations data
 */
export function useOrganizationByUserId(userId: string | undefined) {
  return api.organizations.getByUserId.useQuery(
    { userId: userId || '' },
    {
      enabled: !!userId,
      retry: (failureCount, error) => {
        const err = error as unknown as Error;
        if (err?.message?.includes('Forbidden')) return false;
        return failureCount < 3;
      },
    }
  );
}
