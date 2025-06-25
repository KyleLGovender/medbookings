'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveRequirementAction,
  approveServiceProviderAction,
  checkAllRequiredRequirementsApprovedAction,
  getProviderRequirementSubmissionsAction,
  rejectRequirementAction,
  rejectServiceProviderAction,
} from '../lib/server-actions';

/**
 * Hook for fetching provider requirement submissions (admin view)
 * @param serviceProviderId The ID of the service provider
 * @returns Query result with requirement submissions
 */
export function useProviderRequirementSubmissions(serviceProviderId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'provider-requirement-submissions', serviceProviderId],
    queryFn: async () => {
      if (!serviceProviderId) {
        throw new Error('Service Provider ID is required');
      }

      const result = await getProviderRequirementSubmissionsAction(serviceProviderId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!serviceProviderId,
  });
}

/**
 * Hook for checking if all required requirements are approved
 * @param serviceProviderId The ID of the service provider
 * @returns Query result with approval status
 */
export function useRequiredRequirementsStatus(serviceProviderId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'required-requirements-status', serviceProviderId],
    queryFn: async () => {
      if (!serviceProviderId) {
        throw new Error('Service Provider ID is required');
      }

      const result = await checkAllRequiredRequirementsApprovedAction(serviceProviderId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!serviceProviderId,
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
        queryKey: ['admin', 'provider-requirement-submissions', data.serviceProviderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', data.serviceProviderId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', data.serviceProviderId] });
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
        queryKey: ['admin', 'provider-requirement-submissions', data.serviceProviderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', data.serviceProviderId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', data.serviceProviderId] });
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
 * Hook for approving a service provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for approving a provider
 */
export function useApproveServiceProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (serviceProviderId: string) => {
      const result = await approveServiceProviderAction(serviceProviderId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, serviceProviderId) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', serviceProviderId] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', serviceProviderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', serviceProviderId],
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
 * Hook for rejecting a service provider
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for rejecting a provider
 */
export function useRejectServiceProvider(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { serviceProviderId: string; rejectionReason: string }>({
    mutationFn: async ({ serviceProviderId, rejectionReason }) => {
      const result = await rejectServiceProviderAction(serviceProviderId, rejectionReason);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider', variables.serviceProviderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'required-requirements-status', variables.serviceProviderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-requirement-submissions', variables.serviceProviderId],
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
