'use client';

import { api } from '@/utils/api';

/**
 * Hook for deleting a provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for deleting a provider
 */
export function useDeleteProvider(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.delete.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      utils.providers.getById.invalidate({ id: variables.id });
      utils.providers.search.invalidate();

      // Invalidate getByUserId queries - this ensures Settings page updates reactively
      utils.providers.getByUserId.invalidate();

      // Also invalidate profile and settings queries as they may depend on provider status
      utils.profile.invalidate();
      utils.settings.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
