'use client';

import { useSession } from 'next-auth/react';
import { useProviderByUserId } from './use-provider-by-user-id';

/**
 * Hook to get the current user's provider profile
 */
export function useCurrentUserProvider() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  return useProviderByUserId(userId || '');
}