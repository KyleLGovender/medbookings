import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for updating a provider's basic information
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating provider basic info
 */
export function useUpdateProviderBasicInfo(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<any, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const providerId = formData.get('id') as string;

      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}/basic-info`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update basic information');
      }

      return response.json();
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
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
        throw new Error('Provider ID is required for service update');
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
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

/**
 * Hook for updating a provider's regulatory requirements
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating provider requirements
 */
export function useUpdateProviderRequirements(options?: {
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
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
