'use client';

import { useQuery } from '@tanstack/react-query';

interface ProviderTypeData {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Hook to fetch all available provider types
 */
export function useProviderTypes() {
  return useQuery<ProviderTypeData[], Error>({
    queryKey: ['provider-types'],
    queryFn: async () => {
      // Fetch provider types from the API endpoint
      const url = new URL('/api/providers/provider-types', window.location.origin);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch provider types');
      }

      return response.json();
    },
  });
}
