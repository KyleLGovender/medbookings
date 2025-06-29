import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  InvitationAction,
  ProviderInvitationData,
  ProviderInvitationWithDetails,
} from '@/features/organizations/types/types';

interface SendProviderInvitationParams {
  organizationId: string;
  data: ProviderInvitationData;
}

/**
 * Hook for sending provider invitations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for sending provider invitations
 */
export function useSendProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SendProviderInvitationParams>({
    mutationFn: async ({ organizationId, data }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}/provider-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the invitations list to refresh it
      queryClient.invalidateQueries({
        queryKey: ['providerInvitations', variables.organizationId],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for fetching provider invitations for an organization
 * @param organizationId The organization ID
 * @param status Optional status filter
 * @returns Query object with provider invitations data
 */
export function useProviderInvitations(organizationId: string, status?: string) {
  return useQuery<{ invitations: ProviderInvitationWithDetails[] }, Error>({
    queryKey: ['providerInvitations', organizationId, status],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/provider-invitations?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch invitations');
      }

      return response.json();
    },
    enabled: !!organizationId,
  });
}

interface ManageInvitationParams {
  organizationId: string;
  invitationId: string;
  action: 'cancel' | 'resend';
}

/**
 * Hook for managing provider invitations (cancel/resend)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for managing invitations
 */
export function useManageProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, ManageInvitationParams>({
    mutationFn: async ({ organizationId, invitationId, action }) => {
      if (!organizationId || !invitationId) {
        throw new Error('Organization ID and invitation ID are required');
      }

      let response: Response;

      if (action === 'cancel') {
        response = await fetch(
          `/api/organizations/${organizationId}/provider-invitations/${invitationId}`,
          { method: 'DELETE' }
        );
      } else if (action === 'resend') {
        response = await fetch(
          `/api/organizations/${organizationId}/provider-invitations/${invitationId}/resend`,
          { method: 'POST' }
        );
      } else {
        throw new Error('Invalid action');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} invitation`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the invitations list to refresh it
      queryClient.invalidateQueries({
        queryKey: ['providerInvitations', variables.organizationId],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
