'use client';

import { api } from '@/utils/api';

/**
 * Hook for suspending a provider (admin only)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for suspending a provider
 */
export function useSuspendProvider(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.suspend.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      if (variables.id) {
        utils.admin.getProviderById.invalidate({ id: variables.id });
      }
      utils.admin.getProviders.invalidate();
      utils.admin.getPendingProviders.invalidate();
      utils.admin.getDashboardStats.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for unsuspending (reactivating) a provider (admin and self-service)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for unsuspending a provider
 */
export function useUnsuspendProvider(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.unsuspend.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      if (variables.id) {
        utils.admin.getProviderById.invalidate({ id: variables.id });
      }
      utils.admin.getProviders.invalidate();
      utils.admin.getPendingProviders.invalidate();
      utils.admin.getDashboardStats.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
