import { api } from '@/utils/api';

/**
 * Hook to fetch available services for a provider based on all their provider types
 * @param providerId The ID of the provider
 * @returns Query result containing the available services
 */
export function useProviderTypeServices(providerId: string | undefined) {
  // First, fetch the provider to get its type IDs
  const providerQuery = api.providers.getById.useQuery(
    { id: providerId! },
    { enabled: !!providerId }
  );

  // Extract provider type IDs from the provider data
  const providerTypeIds =
    providerQuery.data?.typeAssignments?.map((assignment: any) => assignment.providerType.id) || [];

  // Fetch services based on all provider type IDs
  return api.providers.getServicesForMultipleTypes.useQuery(
    {
      providerTypeIds,
      providerId: providerId,
    },
    {
      enabled: !!providerId && providerTypeIds.length > 0,
    }
  );
}
