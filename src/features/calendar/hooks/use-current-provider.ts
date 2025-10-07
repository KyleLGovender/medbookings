'use client';

import { useSession } from 'next-auth/react';

import { api } from '@/utils/api';

/**
 * Hook to get the current user's provider profile (calendar feature)
 * Returns loading state that includes session loading to prevent flash
 */
export function useCurrentProvider() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  const providerQuery = api.providers.getByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    }
  );

  // If session is still loading, we should show loading
  const isLoading =
    sessionStatus === 'loading' || (sessionStatus === 'authenticated' && providerQuery.isLoading);

  return {
    ...providerQuery,
    isLoading,
  };
}
