import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for updating a provider's regulatory requirements
 * @returns Mutation object for updating provider requirements
 */
export function useUpdateProviderRequirements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const providerId = formData.get('id') as string;

      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}/requirements`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update requirements');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const providerId = variables.get('id') as string;

      // Invalidate and refetch provider data
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });

      // Return any additional data or redirect info
      return data;
    },
  });
}
