import { useQuery } from '@tanstack/react-query';

import { Service } from '@/features/providers/types';

export function useProviderAssociatedServices(providerId: string | undefined) {
  return useQuery<Service[]>({
    queryKey: ['provider-associated-services', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }
      const response = await fetch(`/api/providers/${providerId}/services`);
      if (!response.ok) {
        throw new Error('Failed to fetch provider associated services');
      }
      return response.json();
    },
    enabled: !!providerId,
  });
}
