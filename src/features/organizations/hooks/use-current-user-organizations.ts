'use client';

import { useSession } from 'next-auth/react';

import { api } from '@/utils/api';

/**
 * Hook to get all organizations the current user is a member of
 * Returns loading state that includes session loading to prevent flash
 */
export function useCurrentUserOrganizations() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as any)?.id;

  const organizationsQuery = api.organizations.getByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    }
  );

  // If session is still loading, we should show loading
  const isLoading =
    sessionStatus === 'loading' ||
    (sessionStatus === 'authenticated' && organizationsQuery.isLoading);

  return {
    ...organizationsQuery,
    isLoading,
  };
}
