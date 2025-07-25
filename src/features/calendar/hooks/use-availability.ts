'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  AvailabilitySearchParams,
  AvailabilityWithRelations,
  CreateAvailabilityData,
  UpdateAvailabilityData,
} from '@/features/calendar/types/types';
import { 
  apiRequest, 
  shouldRetry, 
  logApiError,
  type ApiError 
} from '@/features/calendar/lib/api-error-handler';

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
  provider: (providerId: string) => 
    [...availabilityKeys.all, 'provider', providerId] as const,
  organization: (organizationId: string) => 
    [...availabilityKeys.all, 'organization', organizationId] as const,
  series: (seriesId: string) => 
    [...availabilityKeys.all, 'series', seriesId] as const,
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
  return useQuery({
    queryKey: availabilityId ? availabilityKeys.detail(availabilityId) : ['availability'],
    queryFn: async () => {
      if (!availabilityId) {
        throw new Error('Availability ID is required');
      }

      return apiRequest(
        `/api/calendar/availability/${availabilityId}`,
        { method: 'GET' },
        { operation: 'fetch availability by ID', resourceId: availabilityId }
      );
    },
    enabled: !!availabilityId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
    retry: shouldRetry,
  });
}

export function useAvailabilitySearch(params: AvailabilitySearchParams) {
  return useQuery({
    queryKey: availabilityKeys.search(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.providerId) searchParams.set('providerId', params.providerId);
      if (params.organizationId) searchParams.set('organizationId', params.organizationId);
      if (params.locationId) searchParams.set('locationId', params.locationId);
      if (params.serviceId) searchParams.set('serviceId', params.serviceId);
      if (params.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params.endDate) searchParams.set('endDate', params.endDate.toISOString());
      if (params.status) searchParams.set('status', params.status);
      if (params.seriesId) searchParams.set('seriesId', params.seriesId);

      return apiRequest(
        `/api/calendar/availability?${searchParams.toString()}`,
        { method: 'GET' },
        { 
          operation: 'search availability', 
          providerId: params.providerId,
          organizationId: params.organizationId 
        }
      );
    },
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
    retry: shouldRetry,
  });
}

export function useProviderAvailability(providerId: string | undefined) {
  return useQuery({
    queryKey: providerId ? availabilityKeys.provider(providerId) : ['availability'],
    queryFn: async () => {
      if (!providerId) {
        throw new Error('Provider ID is required');
      }

      const response = await fetch(`/api/calendar/availability?providerId=${providerId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch provider availability');
      }

      return response.json();
    },
    enabled: !!providerId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
    retry: (failureCount, error) => {
      if (error instanceof Error && /4\d{2}/.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useOrganizationAvailability(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationId ? availabilityKeys.organization(organizationId) : ['availability'],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/calendar/availability?organizationId=${organizationId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch organization availability');
      }

      return response.json();
    },
    enabled: !!organizationId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
    retry: (failureCount, error) => {
      if (error instanceof Error && /4\d{2}/.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useAvailabilitySeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: seriesId ? availabilityKeys.series(seriesId) : ['availability'],
    queryFn: async () => {
      if (!seriesId) {
        throw new Error('Series ID is required');
      }

      const response = await fetch(`/api/calendar/availability?seriesId=${seriesId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch availability series');
      }

      return response.json();
    },
    enabled: !!seriesId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
    retry: (failureCount, error) => {
      if (error instanceof Error && /4\d{2}/.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Mutation hooks
export function useCreateAvailability(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: CreateAvailabilityData) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<AvailabilityWithRelations, Error, CreateAvailabilityData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/calendar/availability/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create availability');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries using standardized keys
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.provider(variables.providerId),
      });

      if (variables.organizationId) {
        queryClient.invalidateQueries({
          queryKey: availabilityKeys.organization(variables.organizationId),
        });
      }

      if (variables.seriesId) {
        queryClient.invalidateQueries({
          queryKey: availabilityKeys.series(variables.seriesId),
        });
      }

      options?.onSuccess?.(data, variables);
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
      const previousAvailability = queryClient.getQueryData(availabilityKeys.detail(variables.id)) as AvailabilityWithRelations | null;

      // Optimistically update the specific availability
      if (previousAvailability) {
        queryClient.setQueryData(availabilityKeys.detail(variables.id), (old: AvailabilityWithRelations | undefined) => ({
          ...old,
          ...variables,
        }));
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
          (query.queryKey[1] === 'search' || query.queryKey[1] === 'provider' || query.queryKey[1] === 'organization')
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
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { id: string; reason?: string; scope?: 'single' | 'future' | 'all' }
  >({
    mutationFn: async ({ id, reason, scope }) => {
      const response = await fetch('/api/calendar/availability/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, reason, scope }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel availability');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate all availability queries
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });

      options?.onSuccess?.(variables);
    },
  });
}

export function useDeleteAvailability(options?: {
  onSuccess?: (variables: { id: string; scope?: 'single' | 'future' | 'all' }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; scope?: 'single' | 'future' | 'all' }>({
    mutationFn: async ({ id, scope }) => {
      const searchParams = new URLSearchParams({ id });
      if (scope) {
        searchParams.set('scope', scope);
      }

      const response = await fetch(`/api/calendar/availability/delete?${searchParams.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete availability');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate all availability queries
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });

      // Remove the specific availability from cache
      queryClient.removeQueries({ queryKey: availabilityKeys.detail(variables.id) });

      options?.onSuccess?.(variables);
    },
  });
}

export function useAcceptAvailabilityProposal(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: { id: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<AvailabilityWithRelations, Error, { id: string }, AcceptAvailabilityContext>({
    mutationFn: async ({ id }) => {
      const response = await fetch('/api/calendar/availability/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept availability proposal');
      }

      return response.json();
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this specific availability
      await queryClient.cancelQueries({
        queryKey: availabilityKeys.detail(variables.id),
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(availabilityKeys.detail(variables.id)) as AvailabilityWithRelations | null;

      // Optimistically update status
      if (previousAvailability) {
        queryClient.setQueryData(availabilityKeys.detail(variables.id), (old: AvailabilityWithRelations | undefined) => ({
          ...old,
          status: 'ACCEPTED' as const,
          acceptedAt: new Date(),
        }));
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (data, variables) => {
      // Update the specific availability in cache
      queryClient.setQueryData(availabilityKeys.detail(variables.id), data);

      // Invalidate provider and organization availability lists using patterns
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'availability' && 
          ['provider', 'organization', 'search'].includes(query.queryKey[1] as string)
      });

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

export function useRejectAvailabilityProposal(options?: {
  onSuccess?: (variables: { id: string; reason?: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; reason?: string }, RejectAvailabilityContext>({
    mutationFn: async ({ id, reason }) => {
      const response = await fetch('/api/calendar/availability/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject availability proposal');
      }
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this specific availability
      await queryClient.cancelQueries({
        queryKey: availabilityKeys.detail(variables.id),
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(availabilityKeys.detail(variables.id)) as AvailabilityWithRelations | null;

      // Optimistically update status
      if (previousAvailability) {
        queryClient.setQueryData(availabilityKeys.detail(variables.id), (old: AvailabilityWithRelations | undefined) => ({
          ...old,
          status: 'REJECTED' as const,
        }));
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (_, variables) => {
      // Invalidate provider and organization availability lists using patterns
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'availability' && 
          ['provider', 'organization', 'search'].includes(query.queryKey[1] as string)
      });

      options?.onSuccess?.(variables);
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
