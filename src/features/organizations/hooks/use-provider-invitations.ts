import { useMutation } from '@tanstack/react-query';

import { api } from '@/utils/api';

/**
 * Hook for sending provider invitations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for sending provider invitations
 */
export function useSendProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const utils = api.useUtils();

  return api.organizations.createProviderInvitation.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate the invitations list to refresh it
      utils.organizations.getProviderInvitations.invalidate({
        organizationId: variables.organizationId,
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for fetching provider invitations for an organization
 * @param organizationId The organization ID
 * @returns Query object with provider invitations data
 */
export function useProviderInvitations(organizationId: string) {
  return api.organizations.getProviderInvitations.useQuery(
    { organizationId },
    {
      enabled: !!organizationId,
    }
  );
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
