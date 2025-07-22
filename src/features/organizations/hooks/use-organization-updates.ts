import { useMutation } from '@tanstack/react-query';

import { OrganizationBasicInfoData, OrganizationLocation } from '@/features/organizations/types/types';

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
    onSuccess: options?.onSuccess,
    onError: options?.onError,
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
    onError: options?.onError,
  });
}

interface UpdateOrganizationLocationsParams {
  organizationId: string;
  locations: OrganizationLocation[];
}

/**
 * Hook for updating an organization's locations
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization locations
 */
export function useUpdateOrganizationLocations(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<any, Error, UpdateOrganizationLocationsParams>({
    mutationFn: async ({ organizationId, locations }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}/locations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization locations');
      }

      return response.json();
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
