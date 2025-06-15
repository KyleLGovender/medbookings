import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch an organization by user ID
 * @param userId The ID of the user to fetch the organization for
 * @returns Query result containing the organization data or null if not found
 */
export function useOrganizationByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: ['organizationByUserId', userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        const response = await fetch(`/api/organizations/user/${userId}`);

        if (response.status === 404) {
          // Not found means the user is not associated with an organization
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching organization by user ID:', error);
        throw error;
      }
    },
    // Don't retry if 404 (user doesn't have an organization)
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    // Skip if no userId is provided
    enabled: !!userId,
  });
}
