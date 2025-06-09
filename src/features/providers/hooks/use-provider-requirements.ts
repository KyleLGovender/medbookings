import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRequirementsForProviderType } from '../lib/provider-types';
import { RequirementType } from '../types/types';

/**
 * Hook for fetching requirement types for a provider
 * @param providerId The ID of the provider
 * @returns Query result with requirement types
 */
export function useProviderRequirementTypes(providerId: string | undefined) {
  // First, fetch the provider to get its type ID
  const providerQuery = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Provider not found');
        }
        throw new Error('Failed to fetch provider data');
      }

      return response.json();
    },
    enabled: !!providerId,
  });

  // Then fetch requirements based on the provider type ID
  return useQuery({
    queryKey: ['providerRequirementTypes', providerId, providerQuery.data?.serviceProviderTypeId],
    queryFn: async () => {
      const providerTypeId = providerQuery.data?.serviceProviderTypeId;

      if (!providerTypeId) {
        return [];
      }

      const requirements = await getRequirementsForProviderType(providerTypeId);

      // Transform the fetched requirements to match our component's expected format
      return requirements.map((req, idx) => ({
        id: req.id,
        name: req.name,
        description: req.description || '',
        validationType: req.validationType,
        isRequired: req.isRequired,
        validationConfig: req.validationConfig,
        index: idx,
      })) as RequirementType[];
    },
    enabled: !!providerId && !!providerQuery.data?.serviceProviderTypeId,
  });
}

/**
 * Hook for updating a provider's regulatory requirements
 * @returns Mutation object for updating provider requirements
 */
export function useUpdateProviderRequirements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const providerId = formData.get('id') as string;

      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/providers/${providerId}/requirements`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update requirements');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const providerId = variables.get('id') as string;

      // Invalidate and refetch provider data
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['providerRequirementTypes'] });

      // Return any additional data or redirect info
      return data;
    },
  });
}
