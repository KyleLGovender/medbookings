import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Service {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number | null;
  defaultPrice?: number | null;
  isSelected?: boolean;
  displayPriority?: number;
}

/**
 * Hook to fetch available services for a provider
 * @param providerId The ID of the provider
 * @returns Query result containing the available services
 */
export function useProviderServices(providerId: string | undefined) {
  // First, fetch the provider to get its type ID
  const providerQuery = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Provider not found');
        }
        throw new Error('Failed to fetch provider data');
      }

      return response.json();
    },
    enabled: !!providerId,
  });

  // Then fetch services based on the provider type ID
  return useQuery<Service[]>({
    queryKey: ['provider-services', providerId, providerQuery.data?.serviceProviderTypeId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      // providerId
      const url = new URL('/api/providers/services', window.location.origin);
      url.searchParams.append('providerId', providerId);

      // providerTypeId
      if (providerQuery.data?.serviceProviderTypeId) {
        url.searchParams.append('providerTypeId', providerQuery.data.serviceProviderTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!providerId && !!providerQuery.data?.serviceProviderTypeId,
  });
}

/**
 * Hook for updating a provider's services
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating provider services
 */
export function useUpdateProviderServices(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const providerId = formData.get('id') as string;

      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}/services`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update services');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const providerId = variables.get('id') as string;

      // Invalidate and refetch provider data
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}
