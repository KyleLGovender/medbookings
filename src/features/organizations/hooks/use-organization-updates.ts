import { api, type RouterInputs } from '@/utils/api';

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

// Extract types from tRPC procedures - OPTION C COMPLIANT
type OrganizationUpdateInput = RouterInputs['organizations']['update'];

/**
 * Hook for updating an organization's billing model using tRPC
 * @param options Optional mutation options including onSuccess and onError callbacks
 * @returns Mutation object for updating organization billing model
 */
export function useUpdateOrganizationBilling(options?: {
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

type UpdateOrganizationLocationsInput = RouterInputs['organizations']['updateLocations'];

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
