import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface OrganizationProviderConnection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUSPENDED';
  acceptedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  serviceProvider: {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    website: string | null;
    bio: string | null;
    image: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    serviceProviderType: {
      id: string;
      name: string;
      description: string | null;
    } | null;
  };
  invitation: {
    id: string;
    email: string;
    customMessage: string | null;
    createdAt: string;
    invitedBy: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  } | null;
}

interface UseOrganizationProviderConnectionsOptions {
  onSuccess?: (data: { connections: OrganizationProviderConnection[] }) => void;
  onError?: (error: Error) => void;
}

export function useOrganizationProviderConnections(
  organizationId: string,
  status?: string,
  options: UseOrganizationProviderConnectionsOptions = {}
) {
  return useQuery({
    queryKey: ['organization-provider-connections', organizationId, status],
    queryFn: async () => {
      const url = new URL(
        `/api/organizations/${organizationId}/provider-connections`,
        window.location.origin
      );

      if (status && status !== 'all') {
        url.searchParams.set('status', status);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch provider connections');
      }

      const data = await response.json();
      return data.connections || [];
    },
  });
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
