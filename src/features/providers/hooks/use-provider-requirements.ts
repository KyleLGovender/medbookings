import { api } from '@/utils/api';

/**
 * Hook for fetching requirement types for a provider based on all their provider types
 * @param providerId The ID of the provider
 * @returns Query result with requirement types
 */
export function useProviderRequirementTypes(providerId: string | undefined) {
  // First, fetch the provider to get its type IDs
  const providerQuery = api.providers.getById.useQuery(
    { id: providerId! },
    { enabled: !!providerId }
  );

  // Extract provider type IDs from the provider data
  const providerTypeIds = providerQuery.data?.providerTypes?.map((type: any) => type.id) || [];

  // Fetch requirements based on all provider type IDs
  return api.providers.getRequirementsForMultipleTypes.useQuery(
    {
      providerTypeIds,
    },
    {
      enabled: !!providerId && providerTypeIds.length > 0,
    }
  );
}
