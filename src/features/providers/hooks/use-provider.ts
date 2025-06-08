import { useQuery } from '@tanstack/react-query';

import { SerializedServiceProvider } from '../types/types';

interface Service {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number | null;
  defaultPrice?: number | null;
  isSelected?: boolean;
  displayPriority?: number;
}

/**
 * Hook to fetch complete provider data and related information
 * @param providerId The ID of the provider to fetch
 * @returns Provider data, available services, and loading/error states
 */
export function useProvider(providerId: string | undefined) {
  // Fetch provider data
  const providerQuery = useQuery<SerializedServiceProvider>({
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
    enabled: !!providerId, // Only run the query if providerId is provided
  });

  // Fetch available services based on provider type
  const servicesQuery = useQuery<Service[]>({
    queryKey: ['services', providerId, providerQuery.data?.serviceProviderTypeId],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      // Build the URL with query parameters
      const url = new URL('/api/providers/services', window.location.origin);

      // Add providerId to check which services are already selected
      url.searchParams.append('providerId', providerId);

      // If we have provider type ID, filter services by provider type
      if (providerQuery.data?.serviceProviderTypeId) {
        url.searchParams.append('providerTypeId', providerQuery.data.serviceProviderTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!providerId && !!providerQuery.data?.id, // Only run when we have provider data
  });

  return {
    // Provider data and state
    provider: providerQuery.data,
    isLoading: providerQuery.isLoading,
    error: providerQuery.error,

    // Services data and state
    availableServices: servicesQuery.data,
    isLoadingServices: servicesQuery.isLoading,
    servicesError: servicesQuery.error,
  };
}

/**
 * Hook to fetch all available services for a provider type
 * @param providerTypeId The ID of the provider type
 * @returns Query result containing the available services
 */
export function useAvailableServices(providerTypeId: string | undefined) {
  return useQuery({
    queryKey: ['available-services', providerTypeId],
    queryFn: async () => {
      if (!providerTypeId) {
        throw new Error('Provider type ID is required');
      }

      const response = await fetch(`/api/provider-types/${providerTypeId}/services`);

      if (!response.ok) {
        throw new Error('Failed to fetch available services');
      }

      return response.json();
    },
    enabled: !!providerTypeId, // Only run the query if providerTypeId is provided
  });
}

/**
 * Hook to fetch all requirement types for a provider type
 * @param providerTypeId The ID of the provider type
 * @returns Query result containing the requirement types
 */
export function useRequirementTypes(providerTypeId: string | undefined) {
  return useQuery({
    queryKey: ['requirement-types', providerTypeId],
    queryFn: async () => {
      if (!providerTypeId) {
        throw new Error('Provider type ID is required');
      }

      const response = await fetch(`/api/provider-types/${providerTypeId}/requirements`);

      if (!response.ok) {
        throw new Error('Failed to fetch requirement types');
      }

      return response.json();
    },
    enabled: !!providerTypeId, // Only run the query if providerTypeId is provided
  });
}
