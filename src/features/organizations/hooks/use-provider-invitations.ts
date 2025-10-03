import { api } from '@/utils/api';

/**
 * Hook for sending provider invitations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for sending provider invitations
 */
export function useSendProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
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

/**
 * Hook for canceling provider invitations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for canceling invitations
 */
export function useCancelProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.organizations.cancelProviderInvitation.useMutation({
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
 * Hook for resending provider invitations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for resending invitations
 */
export function useResendProviderInvitation(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}) {
  const utils = api.useUtils();

  return api.organizations.resendProviderInvitation.useMutation({
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
