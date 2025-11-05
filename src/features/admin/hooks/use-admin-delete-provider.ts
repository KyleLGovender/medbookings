'use client';

import { api } from '@/utils/api';

/**
 * Hook for deleting a provider (admin context)
 *
 * This hook is specifically for admin users deleting providers.
 * It invalidates admin-specific queries after deletion.
 *
 * Note: This is separate from the provider self-deletion hook
 * (useDeleteProvider in providers feature) which invalidates
 * provider-context queries (profile, settings).
 *
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for deleting a provider
 */
export function useAdminDeleteProvider(options?: {
  onSuccess?: (data: unknown, variables: { id: string }) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.delete.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate admin-specific queries
      utils.admin.getProviderById.invalidate({ id: variables.id });
      utils.admin.getProviders.invalidate();
      utils.admin.getPendingProviders.invalidate();
      utils.admin.getDashboardStats.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}
