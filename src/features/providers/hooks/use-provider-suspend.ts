'use client';

import { api } from '@/utils/api';

/**
 * Hook for provider self-suspension
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for suspending own provider profile
 */
export function useProviderSelfSuspend(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.suspend.useMutation({
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries for provider's own data
      utils.providers.getByUserId.invalidate();
      utils.providers.getCurrentProvider.invalidate();
      utils.profile.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for provider self-unsuspension
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for unsuspending own provider profile
 */
export function useProviderSelfUnsuspend(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.providers.unsuspend.useMutation({
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries for provider's own data
      utils.providers.getByUserId.invalidate();
      utils.providers.getCurrentProvider.invalidate();
      utils.profile.invalidate();

      // Call the user-provided onSuccess callback if it exists
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
