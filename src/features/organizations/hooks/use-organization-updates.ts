import { useMutation } from '@tanstack/react-query';

import { OrganizationLocation } from '@/features/organizations/types/types';
import { api } from '@/utils/api';

/**
 * Hook for updating an organization's basic information
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization basic info
 */
export function useUpdateOrganizationBasicInfo(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const utils = api.useUtils();

  return api.organizations.update.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate organization query
      utils.organizations.getById.invalidate({ id: variables.id });
      options?.onSuccess?.(data);
    },
    onError: options?.onError as any,
  });
}

interface UpdateOrganizationBillingParams {
  organizationId: string;
  data: OrganizationBillingData;
}

// Define the type for billing model data
interface OrganizationBillingData {
  billingModel: 'CONSOLIDATED' | 'PER_LOCATION' | 'HYBRID';
}

/**
 * Hook for updating an organization's billing model
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization billing model
 */
export function useUpdateOrganizationBilling(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<any, Error, UpdateOrganizationBillingParams>({
    mutationFn: async ({ organizationId, data }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}/billing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization billing model');
      }

      return response.json();
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError as any,
  });
}

interface UpdateOrganizationLocationsParams {
  organizationId: string;
  locations: OrganizationLocation[];
}

/**
 * Hook for updating an organization's locations using tRPC
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization locations
 */
export function useUpdateOrganizationLocations(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const utils = api.useUtils();

  return api.organizations.updateLocations.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate organization query to refresh the data
      utils.organizations.getById.invalidate({ id: variables.organizationId });
      options?.onSuccess?.(data);
    },
    onError: options?.onError as any,
  });
}
