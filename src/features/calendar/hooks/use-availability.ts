'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type RouterInputs, type RouterOutputs, api } from '@/utils/api';

// Extract types from tRPC procedures - OPTION C COMPLIANT
type AvailabilityWithRelations = RouterOutputs['calendar']['getById'];
type CreateAvailabilityResponse = RouterOutputs['calendar']['create'];
type CreatedAvailability = NonNullable<CreateAvailabilityResponse['availability']>;
type AvailabilitySearchParams = RouterInputs['calendar']['searchAvailability'];
type CreateAvailabilityData = RouterInputs['calendar']['create'];
type UpdateAvailabilityData = RouterInputs['calendar']['update'];

// =============================================================================
// QUERY KEY FACTORY
// =============================================================================

/**
 * Standardized query key factory for calendar availability queries.
 * This ensures consistent cache management and type safety.
 */
export const availabilityKeys = {
  all: ['availability'] as const,
  lists: () => [...availabilityKeys.all, 'list'] as const,
  list: (filters: Partial<AvailabilitySearchParams>) =>
    [...availabilityKeys.lists(), filters] as const,
  details: () => [...availabilityKeys.all, 'detail'] as const,
  detail: (id: string) => [...availabilityKeys.details(), id] as const,
  search: (params: AvailabilitySearchParams) =>
    [...availabilityKeys.all, 'search', params] as const,
  provider: (providerId: string) => [...availabilityKeys.all, 'provider', providerId] as const,
  organization: (organizationId: string) =>
    [...availabilityKeys.all, 'organization', organizationId] as const,
  series: (seriesId: string) => [...availabilityKeys.all, 'series', seriesId] as const,
} as const;

// =============================================================================
// SHARED QUERY OPTIONS
// =============================================================================

/**
 * Default stale time for availability queries (5 minutes)
 * Availability data changes infrequently and can be cached for longer
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Default cache time for availability queries (30 minutes)
 * Keep data in cache longer for better UX
 */
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

// All mutations now use tRPC with automatic optimistic updates and cache invalidation

// Query hooks
export function useAvailabilityById(availabilityId: string | undefined) {
  return api.calendar.getById.useQuery(
    { id: availabilityId || '' },
    {
      enabled: !!availabilityId,
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
    }
  );
}

export function useAvailabilitySearch(params: AvailabilitySearchParams) {
  return api.calendar.searchAvailability.useQuery(
    {
      providerId: params.providerId,
      organizationId: params.organizationId,
      locationId: params.locationId,
      serviceId: params.serviceId,
      startDate:
        params.startDate instanceof Date ? params.startDate.toISOString() : params.startDate,
      endDate: params.endDate instanceof Date ? params.endDate.toISOString() : params.endDate,
      status: params.status,
      seriesId: params.seriesId,
    },
    {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
    }
  );
}

export function useProviderAvailability(providerId: string | undefined) {
  return api.calendar.getByProviderId.useQuery(
    { providerId: providerId! },
    {
      enabled: !!providerId,
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
      retry: (failureCount, error) => {
        if (error instanceof Error && /4\d{2}/.test(error.message)) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
}

export function useOrganizationAvailability(organizationId: string | undefined) {
  return api.calendar.getByOrganizationId.useQuery(
    { organizationId: organizationId! },
    {
      enabled: !!organizationId,
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
      retry: (failureCount, error) => {
        if (error instanceof Error && /4\d{2}/.test(error.message)) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
}

export function useAvailabilitySeries(seriesId: string | undefined) {
  return api.calendar.getBySeriesId.useQuery(
    { seriesId: seriesId! },
    {
      enabled: !!seriesId,
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
      retry: (failureCount, error) => {
        if (error instanceof Error && /4\d{2}/.test(error.message)) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
}

// Mutation hooks
export function useCreateAvailability(options?: {
  onSuccess?: (data: CreatedAvailability, variables: CreateAvailabilityData) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.create.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      utils.calendar.searchAvailability.invalidate();
      utils.calendar.getById.invalidate();

      // The tRPC mutation returns an object with availability property
      if (data?.availability) {
        options?.onSuccess?.(data.availability, variables as any);
      }
    },
  });
}

export function useUpdateAvailability(options?: {
  onSuccess?: (
    data: RouterOutputs['calendar']['update'],
    variables: UpdateAvailabilityData
  ) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.update.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate relevant queries using tRPC utils
      utils.calendar.searchAvailability.invalidate();
      utils.calendar.getById.invalidate({ id: variables.id });

      // Invalidate provider/organization specific queries
      if (data.availability?.providerId) {
        utils.calendar.getByProviderId.invalidate({ providerId: data.availability.providerId });
      }
      if (data.availability?.organizationId) {
        utils.calendar.getByOrganizationId.invalidate({
          organizationId: data.availability.organizationId,
        });
      }
      if (data.availability?.seriesId) {
        utils.calendar.getBySeriesId.invalidate({ seriesId: data.availability.seriesId });
      }

      options?.onSuccess?.(data, variables);
    },
  });
}

export function useCancelAvailability(options?: {
  onSuccess?: (variables: { ids: string[]; scope?: 'single' | 'future' | 'all' }) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.delete.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate all availability queries
      utils.calendar.invalidate();

      options?.onSuccess?.(variables);
    },
  });
}

export function useDeleteAvailability(options?: {
  onSuccess?: (variables: { ids: string[]; scope?: 'single' | 'future' | 'all' }) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.delete.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate all availability queries
      utils.calendar.searchAvailability.invalidate();
      utils.calendar.getById.invalidate();

      options?.onSuccess?.(variables);
    },
  });
}

export function useAcceptAvailabilityProposal(options?: {
  onSuccess?: (data: any, variables: { id: string }) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.accept.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate all availability queries
      utils.calendar.invalidate();

      options?.onSuccess?.(data, variables);
    },
  });
}

export function useRejectAvailabilityProposal(options?: {
  onSuccess?: (variables: { id: string; reason?: string }) => void;
}) {
  const utils = api.useUtils();

  return api.calendar.reject.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate all availability queries
      utils.calendar.invalidate();

      options?.onSuccess?.(variables);
    },
  });
}
