'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

/**
 * Hook to get all organizations the current user is a member of
 */
export function useCurrentUserOrganizations() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['organizations', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await fetch(`/api/organizations/user/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch user organizations');
      }
      return response.json();
    },
    enabled: !!userId,
  });
}
