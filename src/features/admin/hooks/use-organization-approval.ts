'use client';

import React from 'react';

import { OrganizationStatus } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';

import { logger } from '@/lib/logger';
import { api } from '@/utils/api';

interface ApproveOrganizationParams {
  organizationId: string;
}

interface RejectOrganizationParams {
  organizationId: string;
  rejectionReason: string;
}

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Hook for approving an organization
 * @param callbacks Optional success/error callbacks
 * @returns Mutation object for approving organization
 */
export function useApproveOrganization(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const mutation = api.admin.approveOrganization.useMutation();

  // Set up the mutation with callbacks
  React.useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      callbacks?.onSuccess?.();
    }
    if (mutation.isError) {
      callbacks?.onError?.(mutation.error as unknown as Error);
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, queryClient, callbacks]);

  return {
    ...mutation,
    mutate: (params: ApproveOrganizationParams) => {
      mutation.mutate({ id: params.organizationId });
    },
    mutateAsync: async (params: ApproveOrganizationParams) => {
      return mutation.mutateAsync({ id: params.organizationId });
    },
  };
}

/**
 * Hook for rejecting an organization
 * @param callbacks Optional success/error callbacks
 * @returns Mutation object for rejecting organization
 */
export function useRejectOrganization(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const mutation = api.admin.rejectOrganization.useMutation();

  // Set up the mutation with callbacks
  React.useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      callbacks?.onSuccess?.();
    }
    if (mutation.isError) {
      callbacks?.onError?.(mutation.error as unknown as Error);
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, queryClient, callbacks]);

  return {
    ...mutation,
    mutate: (params: RejectOrganizationParams) => {
      mutation.mutate({ id: params.organizationId, reason: params.rejectionReason });
    },
    mutateAsync: async (params: RejectOrganizationParams) => {
      return mutation.mutateAsync({ id: params.organizationId, reason: params.rejectionReason });
    },
  };
}

/**
 * Hook for resetting a rejected organization back to pending status
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for resetting organization status
 */
export function useResetOrganizationStatus(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.resetOrganizationStatus.useMutation({
    onMutate: async ({ id }) => {
      logger.debug('admin', 'Optimistic update - resetting organization status', {
        organizationId: id,
      });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getOrganizationById') && keyStr.includes(id);
        },
      });

      // Snapshot the previous organization value
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousOrganization;
      let actualKey;

      // Look for the actual key in the cache
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getOrganizationById') && keyStr.includes(id)) {
          actualKey = query.queryKey;
          previousOrganization = query.state.data;
          logger.debug('admin', 'Found organization data with actual key', { actualKey });
          break;
        }
      }

      if (!previousOrganization || !actualKey) {
        logger.warn('Could not find organization data to snapshot', {
          organizationId: id,
        });
        return { previousOrganization: null, organizationId: id, actualKey: null };
      }

      // Optimistically update the organization cache
      queryClient.setQueryData(actualKey, (old: unknown) => {
        if (!old) return old;

        const updated = {
          ...old,
          status: OrganizationStatus.PENDING_APPROVAL,
          rejectedAt: null,
          rejectionReason: null,
          approvedAt: null,
          approvedById: null,
        };
        logger.debug('admin', 'Optimistically updated organization', {
          actualKey,
          newStatus: updated.status,
        });
        return updated;
      });

      return { previousOrganization, organizationId: id, actualKey };
    },
    onError: (err, _variables, context) => {
      logger.error('Reset organization status failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      if (context?.previousOrganization && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousOrganization);
      }

      if (options?.onError) {
        options.onError(err);
      }
    },
    onSuccess: async (data, variables) => {
      logger.debug('admin', 'Reset organization status success - invalidating queries', {
        organizationId: variables.id,
      });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getOrganizationById') && keyStr.includes(variables.id);
        },
      });

      // Also invalidate the organization list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('"getOrganizations"');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}
