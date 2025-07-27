import { api } from '@/utils/api';

/**
 * Hook to fetch organization data
 * @param organizationId The ID of the organization to fetch
 * @returns Query result containing the organization data
 */
export function useOrganization(organizationId: string | undefined) {
  return api.organizations.getById.useQuery(
    { id: organizationId || '' },
    {
      enabled: !!organizationId,
    }
  );
}
