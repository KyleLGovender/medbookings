'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type ApiError,
  apiRequest,
  logApiError,
  shouldRetry,
} from '@/features/calendar/lib/api-error-handler';
import {
  AvailabilitySearchParams,
  CreateAvailabilityData,
  UpdateAvailabilityData,
} from '@/features/calendar/types/types';
import { api, type RouterOutputs } from '@/utils/api';

// Extract types from tRPC procedures
type AvailabilityWithRelations = RouterOutputs['calendar']['getById'];
type CreateAvailabilityResponse = RouterOutputs['calendar']['create'];
type CreatedAvailability = NonNullable<CreateAvailabilityResponse['availability']>;

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

// Add context type definitions at the top of the file
type UpdateAvailabilityContext = {
  previousAvailability: AvailabilityWithRelations | null;
  availabilityId: string;
};

type AcceptAvailabilityContext = {
  previousAvailability: AvailabilityWithRelations | null;
  availabilityId: string;
};

type RejectAvailabilityContext = {
  previousAvailability: AvailabilityWithRelations | null;
  availabilityId: string;
};

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
      startDate: params.startDate?.toISOString(),
      endDate: params.endDate?.toISOString(),
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
    data: AvailabilityWithRelations,
    variables: UpdateAvailabilityData & { scope?: 'single' | 'future' | 'all' }
  ) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<
    AvailabilityWithRelations,
    Error,
    UpdateAvailabilityData & { scope?: 'single' | 'future' | 'all' },
    UpdateAvailabilityContext
  >({
    mutationFn: async (data) => {
      const response = await fetch('/api/calendar/availability/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update availability');
      }

      return response.json();
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this specific availability
      await queryClient.cancelQueries({
        queryKey: availabilityKeys.detail(variables.id),
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(
        availabilityKeys.detail(variables.id)
      ) as AvailabilityWithRelations | null;

      // Optimistically update the specific availability
      if (previousAvailability) {
        queryClient.setQueryData(
          availabilityKeys.detail(variables.id),
          (old: AvailabilityWithRelations | undefined) => ({
            ...old,
            ...variables,
          })
        );
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (data, variables) => {
      // Update the specific availability in cache
      queryClient.setQueryData(availabilityKeys.detail(variables.id), data);

      // Invalidate related queries using patterns
      queryClient.invalidateQueries({ queryKey: availabilityKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'availability' &&
          (query.queryKey[1] === 'search' ||
            query.queryKey[1] === 'provider' ||
            query.queryKey[1] === 'organization'),
      });

      if (data.seriesId) {
        queryClient.invalidateQueries({
          queryKey: availabilityKeys.series(data.seriesId),
        });
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousAvailability) {
        queryClient.setQueryData(
          availabilityKeys.detail(context.availabilityId),
          context.previousAvailability
        );
      }
    },
  });
}

export function useCancelAvailability(options?: {
  onSuccess?: (variables: {
    id: string;
    reason?: string;
    scope?: 'single' | 'future' | 'all';
  }) => void;
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
  onSuccess?: (data: AvailabilityWithRelations, variables: { id: string }) => void;
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
