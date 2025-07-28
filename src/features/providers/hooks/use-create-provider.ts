'use client';

import { api } from '@/utils/api';

/**
 * Hook for creating a new provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for creating a provider
 */
export function useCreateProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const utils = api.useUtils();

  return api.providers.create.useMutation({
    onSuccess: (data) => {
      // Invalidate provider queries
      utils.providers.search.invalidate();
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
