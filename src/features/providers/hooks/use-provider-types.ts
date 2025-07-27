'use client';

import { api } from '@/utils/api';

/**
 * Hook to fetch all available provider types
 */
export function useProviderTypes() {
  return api.providers.getProviderTypes.useQuery();
}
