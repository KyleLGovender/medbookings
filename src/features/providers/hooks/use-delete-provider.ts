'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for deleting a service provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for deleting a provider
 */
export function useDeleteProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (providerId: string) => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete provider');
      }

      return response.json();
    },
    onSuccess: (data, providerId) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });

      // If the user has a list of their providers, invalidate that too
      queryClient.invalidateQueries({ queryKey: ['user-providers'] });

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
