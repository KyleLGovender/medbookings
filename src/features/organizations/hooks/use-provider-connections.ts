import { api, type RouterOutputs } from '@/utils/api';

// Infer the type from the tRPC router output
export type ProviderConnection = RouterOutputs['organizations']['getProviderConnections'][number];

export function useOrganizationProviderConnections(organizationId: string) {
  return api.organizations.getProviderConnections.useQuery(
    { organizationId },
    {
      enabled: !!organizationId,
    }
  );
}

interface ManageOrganizationProviderConnectionOptions {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: Error) => void;
}

export function useManageOrganizationProviderConnection(
  organizationId: string,
  options: ManageOrganizationProviderConnectionOptions = {}
) {
  const utils = api.useUtils();

  // Update provider connection status
  const updateConnection = api.organizations.updateProviderConnection.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate and refetch organization provider connections
      utils.organizations.getProviderConnections.invalidate({ organizationId });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
  });

  // Delete provider connection
  const deleteConnection = api.organizations.deleteProviderConnection.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate and refetch organization provider connections
      utils.organizations.getProviderConnections.invalidate({ organizationId });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
  });

  return {
    mutate: (params: {
      connectionId: string;
      action: 'update' | 'delete';
      data?: { status: 'ACCEPTED' | 'SUSPENDED' };
    }) => {
      if (params.action === 'update' && params.data?.status) {
        updateConnection.mutate({
          organizationId,
          connectionId: params.connectionId,
          status: params.data.status,
        });
      } else if (params.action === 'delete') {
        deleteConnection.mutate({
          organizationId,
          connectionId: params.connectionId,
        });
      }
    },
    isLoading: updateConnection.isLoading || deleteConnection.isLoading,
    error: updateConnection.error || deleteConnection.error,
  };
}