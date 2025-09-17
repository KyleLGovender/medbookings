'use client';

import { useSession } from 'next-auth/react';

import { useProviderByUserId } from './use-provider-by-user-id';

/**
 * Hook to get the current user's provider profile
 * Returns loading state that includes session loading to prevent flash
 */
export function useCurrentUserProvider() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as any)?.id;

  const providerQuery = useProviderByUserId(userId || '');

  // If session is still loading, we should show loading
  const isLoading =
    sessionStatus === 'loading' || (sessionStatus === 'authenticated' && providerQuery.isLoading);

  return {
    ...providerQuery,
    isLoading,
  };
}
