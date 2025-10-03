'use client';

import { ProviderStatus, RequirementsValidationStatus } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

import { logger } from '@/lib/logger';
import { api } from '@/utils/api';

/**
 * Hook for checking if all required requirements are approved
 * @param providerId The ID of the provider
 * @returns Query result with approval status
 */
export function useRequiredRequirementsStatus(providerId: string | undefined) {
  return api.admin.getProviderRequirements.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
      select: (data) => {
        const requiredSubmissions = data.filter(
          (submission) => submission.requirementType.isRequired
        );
        const allApproved = requiredSubmissions.every(
          (submission) => submission.status === RequirementsValidationStatus.APPROVED
        );
        return {
          allRequiredApproved: allApproved,
          requiredCount: requiredSubmissions.length,
          approvedCount: requiredSubmissions.filter(
            (s) => s.status === RequirementsValidationStatus.APPROVED
          ).length,
        };
      },
    }
  );
}

/**
 * Hook for approving a requirement submission
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for approving a requirement
 */
export function useApproveRequirement(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.approveRequirement.useMutation({
    onMutate: async ({ providerId, requirementId }) => {
      logger.debug('Optimistic update - approving requirement', { providerId, requirementId });

      // Cancel any outgoing refetches for requirements - try different query key patterns
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          logger.debug('Checking query for cancellation', { keyStr });
          return keyStr.includes('getProviderRequirements');
        },
      });

      // First, let's inspect the cache to find the correct key structure
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      logger.debug('All cached queries');
      allQueries.forEach((query) => {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderRequirements')) {
          logger.debug('Found requirements query', {
            queryKey: query.queryKey,
            hasData: !!query.state.data,
          });
        }
      });

      // Snapshot the previous requirements value - try different query key patterns
      let previousRequirements;
      let actualKey;

      // Look for the actual key in the cache
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderRequirements') && keyStr.includes(providerId)) {
          actualKey = query.queryKey;
          previousRequirements = query.state.data;
          logger.debug('Found requirements data with actual key', { actualKey });
          break;
        }
      }

      if (!previousRequirements || !actualKey) {
        logger.warn('Could not find requirements data to snapshot');
        return { previousRequirements: null, providerId, actualKey: null };
      }

      // Optimistically update the requirements cache using the actual key
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old || !Array.isArray(old)) return old;

        const updated = old.map((sub: any) =>
          sub.id === requirementId
            ? {
                ...sub,
                status: RequirementsValidationStatus.APPROVED,
                validatedAt: new Date().toISOString(),
                validatedById: 'optimistic',
              }
            : sub
        );
        logger.debug('Optimistically updated cache', { actualKey, dataCount: updated?.length });
        return updated;
      });

      return { previousRequirements, providerId, actualKey };
    },
    onError: (err, _variables, context) => {
      logger.error('Approve requirement failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      if (context?.previousRequirements && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousRequirements);
      }

      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onSuccess: async (data, variables) => {
      logger.debug('Approve requirement success - invalidating queries', {
        providerId: variables.providerId,
      });

      // Invalidate queries containing getProviderRequirements and the provider ID
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          const shouldInvalidate =
            keyStr.includes('getProviderRequirements') && keyStr.includes(variables.providerId);
          if (shouldInvalidate) {
            logger.debug('Invalidating requirements query', { queryKey: query.queryKey });
          }
          return shouldInvalidate;
        },
      });

      // Also invalidate the provider list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('"getProviders"');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

/**
 * Hook for rejecting a requirement submission
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for rejecting a requirement
 */
export function useRejectRequirement(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.rejectRequirement.useMutation({
    onMutate: async ({ providerId, requirementId, reason }) => {
      // Cancel any outgoing refetches for requirements
      await queryClient.cancelQueries({
        queryKey: ['admin', 'getProviderRequirements', { id: providerId }],
      });

      // Snapshot the previous requirements value
      const previousRequirements = queryClient.getQueryData([
        'admin',
        'getProviderRequirements',
        { id: providerId },
      ]);

      // Optimistically update the requirements cache
      queryClient.setQueryData(
        ['admin', 'getProviderRequirements', { id: providerId }],
        (old: any) => {
          if (!old || !Array.isArray(old)) return old;

          return old.map((sub: any) =>
            sub.id === requirementId
              ? {
                  ...sub,
                  status: RequirementsValidationStatus.REJECTED,
                  validatedAt: new Date().toISOString(),
                  validatedById: 'optimistic', // This will be replaced by the real value
                  notes: reason,
                }
              : sub
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousRequirements, providerId };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousRequirements) {
        queryClient.setQueryData(
          ['admin', 'getProviderRequirements', { id: context.providerId }],
          context.previousRequirements
        );
      }

      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific queries
      queryClient.invalidateQueries({
        queryKey: ['admin', 'getProviderRequirements', { id: variables.providerId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'getProviders'],
      });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

/**
 * Hook for approving a provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for approving a provider
 */
export function useApproveProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.approveProvider.useMutation({
    onMutate: async ({ id }) => {
      logger.debug('Optimistic update - approving provider', { providerId: id });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(id);
        },
      });

      // Snapshot the previous provider value
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousProvider;
      let actualKey;

      // Look for the actual key in the cache
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderById') && keyStr.includes(id)) {
          actualKey = query.queryKey;
          previousProvider = query.state.data;
          logger.debug('Found provider data with actual key', { actualKey });
          break;
        }
      }

      if (!previousProvider || !actualKey) {
        logger.warn('Could not find provider data to snapshot');
        return { previousProvider: null, providerId: id, actualKey: null };
      }

      // Optimistically update the provider cache
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          status: ProviderStatus.APPROVED,
          approvedAt: new Date().toISOString(),
          approvedById: 'optimistic',
          rejectedAt: null,
          rejectionReason: null,
        };
        logger.debug('Optimistically updated provider', { actualKey, status: updated?.status });
        return updated;
      });

      return { previousProvider, providerId: id, actualKey };
    },
    onError: (err, _variables, context) => {
      logger.error('Approve provider failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      if (context?.previousProvider && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousProvider);
      }

      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onSuccess: async (data, variables) => {
      logger.debug('Approve provider success - invalidating queries', { providerId: variables.id });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(variables.id);
        },
      });

      // Also invalidate the provider list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('"getProviders"');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

/**
 * Hook for rejecting a provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for rejecting a provider
 */
export function useRejectProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.rejectProvider.useMutation({
    onMutate: async ({ id, reason }) => {
      logger.debug('Optimistic update - rejecting provider', { providerId: id, hasReason: !!reason });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(id);
        },
      });

      // Snapshot the previous provider value
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousProvider;
      let actualKey;

      // Look for the actual key in the cache
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderById') && keyStr.includes(id)) {
          actualKey = query.queryKey;
          previousProvider = query.state.data;
          logger.debug('Found provider data with actual key', { actualKey });
          break;
        }
      }

      if (!previousProvider || !actualKey) {
        logger.warn('Could not find provider data to snapshot');
        return { previousProvider: null, providerId: id, actualKey: null };
      }

      // Optimistically update the provider cache
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          status: ProviderStatus.REJECTED,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
          approvedAt: null,
          approvedById: null,
        };
        logger.debug('Optimistically updated provider', { actualKey, status: updated?.status });
        return updated;
      });

      return { previousProvider, providerId: id, actualKey };
    },
    onError: (err, _variables, context) => {
      logger.error('Reject provider failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      if (context?.previousProvider && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousProvider);
      }

      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onSuccess: async (data, variables) => {
      logger.debug('Reject provider success - invalidating queries', { providerId: variables.id });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(variables.id);
        },
      });

      // Also invalidate the provider list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('"getProviders"');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

/**
 * Hook for resetting a rejected provider back to pending status
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for resetting provider status
 */
export function useResetProviderStatus(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return api.admin.resetProviderStatus.useMutation({
    onMutate: async ({ id }) => {
      logger.debug('Optimistic update - resetting provider status', { providerId: id });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(id);
        },
      });

      // Snapshot the previous provider value
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousProvider;
      let actualKey;

      // Look for the actual key in the cache
      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getProviderById') && keyStr.includes(id)) {
          actualKey = query.queryKey;
          previousProvider = query.state.data;
          logger.debug('Found provider data with actual key', { actualKey });
          break;
        }
      }

      if (!previousProvider || !actualKey) {
        logger.warn('Could not find provider data to snapshot');
        return { previousProvider: null, providerId: id, actualKey: null };
      }

      // Optimistically update the provider cache
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          status: ProviderStatus.PENDING_APPROVAL,
          rejectedAt: null,
          rejectionReason: null,
          approvedAt: null,
          approvedById: null,
        };
        logger.debug('Optimistically updated provider', { actualKey, status: updated?.status });
        return updated;
      });

      return { previousProvider, providerId: id, actualKey };
    },
    onError: (err, _variables, context) => {
      logger.error('Reset provider status failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      if (context?.previousProvider && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousProvider);
      }

      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onSuccess: async (data, variables) => {
      logger.debug('Reset provider status success - invalidating queries', {
        providerId: variables.id,
      });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getProviderById') && keyStr.includes(variables.id);
        },
      });

      // Also invalidate the provider list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('"getProviders"');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

// Backward compatibility exports for hooks
export const useApproveServiceProvider = useApproveProvider;
export const useRejectServiceProvider = useRejectProvider;
