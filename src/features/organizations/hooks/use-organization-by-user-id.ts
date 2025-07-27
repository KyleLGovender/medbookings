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
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Forbidden')) return false;
        return failureCount < 3;
      },
    }
  );
}
