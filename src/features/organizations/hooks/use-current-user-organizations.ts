'use client';

import { useSession } from 'next-auth/react';

import { api } from '@/utils/api';

/**
 * Hook to get all organizations the current user is a member of
 */
export function useCurrentUserOrganizations() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return api.organizations.getByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    }
  );
}
