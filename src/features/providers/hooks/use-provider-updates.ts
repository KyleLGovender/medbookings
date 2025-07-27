import { api } from '@/utils/api';

/**
 * Hook for updating a provider's basic information
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating provider basic info
 */
export function useUpdateProviderBasicInfo(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const utils = api.useUtils();
  
  return api.providers.update.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate provider query
      utils.providers.getById.invalidate({ id: variables.id });
      options?.onSuccess?.(data);
    },
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
  const utils = api.useUtils();

  return api.providers.updateServices.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate provider and services queries
      utils.providers.getById.invalidate({ id: variables.id });
      utils.providers.getProviderServices.invalidate({ id: variables.id });
      options?.onSuccess?.(data);
    },
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
  const utils = api.useUtils();

  return api.providers.updateRequirements.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate provider query
      utils.providers.getById.invalidate({ id: variables.id });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
