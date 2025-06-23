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
    onError: (error: Error) => {
      console.error('Error approving organization:', error);
      callbacks?.onError?.(error);
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
    onError: (error: Error) => {
      console.error('Error rejecting organization:', error);
      callbacks?.onError?.(error);
    },
  });
}
