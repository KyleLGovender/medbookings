'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { approveOrganizationAction, rejectOrganizationAction } from '../lib/server-actions';

interface ApproveOrganizationParams {
  organizationId: string;
}

interface RejectOrganizationParams {
  organizationId: string;
  rejectionReason: string;
}

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for approving an organization
 * @param callbacks Optional success/error callbacks
 * @returns Mutation object for approving organization
 */
export function useApproveOrganization(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId }: ApproveOrganizationParams) => {
      const result = await approveOrganizationAction(organizationId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve organization');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData([
        'admin',
        'organization',
        variables.organizationId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin', 'organization', variables.organizationId],
        (old: any) => ({
          ...old,
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
        })
      );

      // Return a context object with the snapshotted value
      return { previousOrganization, organizationId: variables.organizationId };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization-counts'] });

      // Call user-defined success callback
      callbacks?.onSuccess?.();
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ['admin', 'organization', context.organizationId],
          context.previousOrganization
        );
      }
      console.error('Error approving organization:', error);
      callbacks?.onError?.(error);
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });
    },
  });
}

/**
 * Hook for rejecting an organization
 * @param callbacks Optional success/error callbacks
 * @returns Mutation object for rejecting organization
 */
export function useRejectOrganization(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, rejectionReason }: RejectOrganizationParams) => {
      const result = await rejectOrganizationAction(organizationId, rejectionReason);

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject organization');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData([
        'admin',
        'organization',
        variables.organizationId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin', 'organization', variables.organizationId],
        (old: any) => ({
          ...old,
          status: 'REJECTED',
          rejectedAt: new Date().toISOString(),
          rejectionReason: variables.rejectionReason,
        })
      );

      // Return a context object with the snapshotted value
      return { previousOrganization, organizationId: variables.organizationId };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization-counts'] });

      // Call user-defined success callback
      callbacks?.onSuccess?.();
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ['admin', 'organization', context.organizationId],
          context.previousOrganization
        );
      }
      console.error('Error rejecting organization:', error);
      callbacks?.onError?.(error);
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['admin', 'organization', variables.organizationId],
      });
    },
  });
}
