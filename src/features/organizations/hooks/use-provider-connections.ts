import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/utils/api';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      connectionId: string;
      action: 'update' | 'delete';
      data?: { status: string };
    }) => {
      const url = `/api/organizations/${organizationId}/provider-connections/${params.connectionId}`;

      const response = await fetch(url, {
        method: params.action === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        ...(params.action === 'update' && { body: JSON.stringify(params.data) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to manage provider connection');
      }

      if (params.action === 'delete') {
        return { message: 'Connection deleted successfully' };
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch organization provider connections
      queryClient.invalidateQueries({
        queryKey: ['organization-provider-connections', organizationId],
      });

      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
  });
}
