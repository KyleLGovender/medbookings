'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/utils/api';

/**
 * Hook for fetching provider requirement submissions (admin view)
 * @param providerId The ID of the provider
 * @returns Query result with requirement submissions
 */
export function useProviderRequirementSubmissions(providerId: string | undefined) {
  return api.admin.getProviderById.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
      select: (data) => data.requirementSubmissions,
    }
  );
}

/**
 * Hook for checking if all required requirements are approved
 * @param providerId The ID of the provider
 * @returns Query result with approval status
 */
export function useRequiredRequirementsStatus(providerId: string | undefined) {
  return api.admin.getProviderById.useQuery(
    { id: providerId || '' },
    {
      enabled: !!providerId,
      select: (data) => {
        const requiredSubmissions = data.requirementSubmissions.filter(
          (submission) => submission.requirementType.isRequired
        );
        const allApproved = requiredSubmissions.every(
          (submission) => submission.status === 'APPROVED'
        );
        return {
          allRequiredApproved: allApproved,
          requiredCount: requiredSubmissions.length,
          approvedCount: requiredSubmissions.filter((s) => s.status === 'APPROVED').length,
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
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error as any);
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
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error as any);
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
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error as any);
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
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error as any);
      }
    },
  });
}

// Backward compatibility exports for hooks
export const useApproveServiceProvider = useApproveProvider;
export const useRejectServiceProvider = useRejectProvider;
