import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ConnectionUpdate, InvitationResponse } from '@/features/providers/types/schemas';
import {
  OrganizationConnectionWithDetails,
  ProviderInvitationWithOrganization,
} from '@/features/providers/types/types';

/**
 * Hook for fetching provider invitations
 * @param status Optional status filter
 * @returns Query object with provider invitations data
 */
export function useProviderInvitations(status?: string) {
  return useQuery<{ invitations: ProviderInvitationWithOrganization[] }, Error>({
    queryKey: ['providerInvitations', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/providers/invitations?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch invitations');
      }

      return response.json();
    },
  });
}

interface RespondToInvitationParams {
  token: string;
  response: InvitationResponse;
}

/**
 * Hook for responding to provider invitations (accept/reject)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for responding to invitations
 */
export function useRespondToInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, RespondToInvitationParams>({
    mutationFn: async ({ token, response }) => {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const apiResponse = await fetch(`/api/providers/invitations/${token}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Failed to respond to invitation');
      }

      return apiResponse.json();
    },
    onSuccess: (data) => {
      // Invalidate both invitations and connections to refresh the data
      queryClient.invalidateQueries({ queryKey: ['providerInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['organizationConnections'] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for fetching organization connections for a provider
 * @param status Optional status filter
 * @returns Query object with organization connections data
 */
export function useOrganizationConnections(status?: string) {
  return useQuery<{ connections: OrganizationConnectionWithDetails[] }, Error>({
    queryKey: ['organizationConnections', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/providers/connections?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch connections');
      }

      return response.json();
    },
  });
}

interface ManageConnectionParams {
  connectionId: string;
  action: 'update' | 'delete';
  data?: ConnectionUpdate;
}

/**
 * Hook for managing organization connections (suspend/reactivate/delete)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for managing connections
 */
export function useManageConnection(options?: {
  onSuccess?: (data: any, variables: ManageConnectionParams) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, ManageConnectionParams>({
    mutationFn: async ({ connectionId, action, data }) => {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      let response: Response;

      if (action === 'update' && data) {
        response = await fetch(`/api/providers/connections/${connectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } else if (action === 'delete') {
        response = await fetch(`/api/providers/connections/${connectionId}`, {
          method: 'DELETE',
        });
      } else {
        throw new Error('Invalid action or missing data');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} connection`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate connections to refresh the data
      queryClient.invalidateQueries({ queryKey: ['organizationConnections'] });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}
