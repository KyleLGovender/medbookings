'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveProviderAction,
  approveRequirementAction,
  checkAllRequiredRequirementsApprovedAction,
  getProviderRequirementSubmissionsAction,
  rejectProviderAction,
  rejectRequirementAction,
} from '../lib/server-actions';

/**
 * Hook for fetching provider requirement submissions (admin view)
 * @param providerId The ID of the provider
 * @returns Query result with requirement submissions
 */
export function useProviderRequirementSubmissions(providerId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'provider-requirement-submissions', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const result = await getProviderRequirementSubmissionsAction(providerId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!providerId,
  });
}

/**
 * Hook for checking if all required requirements are approved
 * @param providerId The ID of the provider
 * @returns Query result with approval status
 */
export function useRequiredRequirementsStatus(providerId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'required-requirements-status', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const result = await checkAllRequiredRequirementsApprovedAction(providerId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!providerId,
  });
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

  return useMutation<any, Error, { requirementSubmissionId: string; adminNotes?: string }>({
    mutationFn: async ({ requirementSubmissionId, adminNotes }) => {
      const result = await approveRequirementAction(requirementSubmissionId, adminNotes);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', data.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', data.providerId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', data.providerId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider-counts'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
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

  return useMutation<any, Error, { requirementSubmissionId: string; rejectionReason: string }>({
    mutationFn: async ({ requirementSubmissionId, rejectionReason }) => {
      const result = await rejectRequirementAction(requirementSubmissionId, rejectionReason);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', data.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', data.providerId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', data.providerId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider-counts'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
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

  return useMutation<any, Error, string>({
    mutationFn: async (providerId: string) => {
      const result = await approveProviderAction(providerId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, providerId) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', providerId] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', providerId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider-counts'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
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

  return useMutation<any, Error, { providerId: string; rejectionReason: string }>({
    mutationFn: async ({ providerId, rejectionReason }) => {
      const result = await rejectProviderAction(providerId, rejectionReason);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider', variables.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', variables.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', variables.providerId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider-counts'] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

// Backward compatibility exports for hooks
export const useApproveServiceProvider = useApproveProvider;
export const useRejectServiceProvider = useRejectProvider;
