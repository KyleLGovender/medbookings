'use client';

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

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
  onError?: (error: Error) => void;
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
      callbacks?.onError?.(mutation.error as Error);
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
      callbacks?.onError?.(mutation.error as Error);
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
