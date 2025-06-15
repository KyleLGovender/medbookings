import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationRegistrationData } from '@/features/organizations/types/types';

/**
 * Hook for registering a new organization
 * @returns Mutation object for registering an organization
 */
export function useRegisterOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrganizationRegistrationData) => {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register organization');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries when a new organization is created
      queryClient.invalidateQueries({ queryKey: ['organizationByUserId'] });
    },
  });
}
