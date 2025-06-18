import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationBasicInfoData } from '@/features/organizations/types/types';

interface UpdateOrganizationBasicInfoParams {
  organizationId: string;
  data: OrganizationBasicInfoData;
}

/**
 * Hook for updating an organization's basic information
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization basic info
 */
export function useUpdateOrganizationBasicInfo(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateOrganizationBasicInfoParams>({
    mutationFn: async ({ organizationId, data }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const { organizationId } = variables;

      // Invalidate and refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    },
    onError: (error) => {
      // Call the user-provided onError callback if it exists
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}
