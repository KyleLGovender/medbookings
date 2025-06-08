'use client';

import { useQuery } from '@tanstack/react-query';

import { ServiceProviderTypeData, getServiceProviderTypes } from '../lib/provider-types';

/**
 * Hook to fetch all available provider types
 */
export function useProviderTypes() {
  return useQuery<ServiceProviderTypeData[], Error>({
    queryKey: ['provider-types'],
    queryFn: async () => {
      return getServiceProviderTypes();
    },
  });
}
