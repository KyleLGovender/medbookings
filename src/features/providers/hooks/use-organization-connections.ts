import { ConnectionStatus, ProviderInvitationStatus } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';

import { type RouterInputs, api } from '@/utils/api';

// Extract types from tRPC input for type safety
type GetInvitationsInput = RouterInputs['providers']['getInvitations'];
type InvitationStatus = GetInvitationsInput['status'];

/**
 * Hook for fetching provider invitations
 * @param status Optional status filter
 * @returns Query object with provider invitations data
 */
export function useProviderInvitations(status?: InvitationStatus) {
  return api.providers.getInvitations.useQuery(status ? { status } : {}, {
    // Always enabled since it handles auth internally
    retry: false,
  });
}

/**
 * Hook for responding to provider invitations (accept/reject)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for responding to invitations
 */
export function useRespondToInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  const queryClient = useQueryClient();

  return api.providers.respondToInvitation.useMutation({
    onSuccess: (data) => {
      // Invalidate both invitations and connections to refresh the data
      queryClient.invalidateQueries({ queryKey: ['providers', 'getInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'getConnections'] });
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
export function useOrganizationConnections(status?: ConnectionStatus) {
  return api.providers.getConnections.useQuery(status ? { status } : {}, {
    // Always enabled since it handles auth internally
    retry: false,
  });
}

/**
 * Hook for updating organization connection status (suspend/reactivate)
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating connections
 */
export function useUpdateConnection(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  const queryClient = useQueryClient();

  return api.providers.updateConnection.useMutation({
    onSuccess: (data) => {
      // Invalidate connections to refresh the data
      queryClient.invalidateQueries({ queryKey: ['providers', 'getConnections'] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for deleting organization connections
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for deleting connections
 */
export function useDeleteConnection(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  const queryClient = useQueryClient();

  return api.providers.deleteConnection.useMutation({
    onSuccess: (data) => {
      // Invalidate connections to refresh the data
      queryClient.invalidateQueries({ queryKey: ['providers', 'getConnections'] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
