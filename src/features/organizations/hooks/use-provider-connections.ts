import { ConnectionStatus } from '@prisma/client';

import { api } from '@/utils/api';

// Type for connection statuses that can be updated
type UpdatableConnectionStatus = Extract<ConnectionStatus, 'ACCEPTED' | 'SUSPENDED'>;

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
  onError?: (error: unknown) => void;
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
      data?: { status: UpdatableConnectionStatus };
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
    isLoading: updateConnection.isPending || deleteConnection.isPending,
    error: updateConnection.error || deleteConnection.error,
  };
}
