'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  AvailabilitySearchParams,
  AvailabilityWithRelations,
  CreateAvailabilityData,
  UpdateAvailabilityData,
} from '@/features/calendar/availability/types/types';

// Add context type definitions at the top of the file
type UpdateAvailabilityContext = {
  previousAvailability: any;
  availabilityId: string;
};

type AcceptAvailabilityContext = {
  previousAvailability: any;
  availabilityId: string;
};

type RejectAvailabilityContext = {
  previousAvailability: any;
  availabilityId: string;
};

// Query hooks
export function useAvailabilityById(availabilityId: string | undefined) {
  return useQuery({
    queryKey: ['availability', availabilityId],
    queryFn: async () => {
      if (!availabilityId) {
        throw new Error('Availability ID is required');
      }

      const response = await fetch(`/api/calendar/availability/${availabilityId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch availability');
      }

      return response.json();
    },
    enabled: !!availabilityId,
  });
}

export function useAvailabilitySearch(params: AvailabilitySearchParams) {
  return useQuery({
    queryKey: ['availability', 'search', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.serviceProviderId) searchParams.set('serviceProviderId', params.serviceProviderId);
      if (params.organizationId) searchParams.set('organizationId', params.organizationId);
      if (params.locationId) searchParams.set('locationId', params.locationId);
      if (params.serviceId) searchParams.set('serviceId', params.serviceId);
      if (params.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params.endDate) searchParams.set('endDate', params.endDate.toISOString());
      if (params.status) searchParams.set('status', params.status);
      if (params.seriesId) searchParams.set('seriesId', params.seriesId);

      const response = await fetch(`/api/calendar/availability?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search availability');
      }

      return response.json();
    },
  });
}

export function useProviderAvailability(serviceProviderId: string | undefined) {
  return useQuery({
    queryKey: ['availability', 'provider', serviceProviderId],
    queryFn: async () => {
      if (!serviceProviderId) {
        throw new Error('Service provider ID is required');
      }

      const response = await fetch(
        `/api/calendar/availability?serviceProviderId=${serviceProviderId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch provider availability');
      }

      return response.json();
    },
    enabled: !!serviceProviderId,
  });
}

export function useOrganizationAvailability(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['availability', 'organization', organizationId],
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
  });
}

export function useAvailabilitySeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: ['availability', 'series', seriesId],
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
  });
}

// Mutation hooks
export function useCreateAvailability(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: CreateAvailabilityData) => void;
  onError?: (error: Error) => void;
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
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({
        queryKey: ['availability', 'provider', variables.serviceProviderId],
      });

      if (variables.organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['availability', 'organization', variables.organizationId],
        });
      }

      if (variables.seriesId) {
        queryClient.invalidateQueries({
          queryKey: ['availability', 'series', variables.seriesId],
        });
      }

      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

export function useUpdateAvailability(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: UpdateAvailabilityData & { scope?: 'single' | 'future' | 'all' }) => void;
  onError?: (error: Error) => void;
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
        queryKey: ['availability', variables.id],
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(['availability', variables.id]);

      // Optimistically update the specific availability
      if (previousAvailability) {
        queryClient.setQueryData(['availability', variables.id], (old: any) => ({
          ...old,
          ...variables,
        }));
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (data, variables) => {
      // Update the specific availability in cache
      queryClient.setQueryData(['availability', variables.id], data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['availability', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'provider'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'organization'] });

      if (data.seriesId) {
        queryClient.invalidateQueries({
          queryKey: ['availability', 'series', data.seriesId],
        });
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousAvailability) {
        queryClient.setQueryData(
          ['availability', context.availabilityId],
          context.previousAvailability
        );
      }

      options?.onError?.(error);
    },
  });
}

export function useCancelAvailability(options?: {
  onSuccess?: (variables: { id: string; reason?: string; scope?: 'single' | 'future' | 'all' }) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; reason?: string; scope?: 'single' | 'future' | 'all' }>({
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
      queryClient.invalidateQueries({ queryKey: ['availability'] });

      options?.onSuccess?.(variables);
    },
    onError: options?.onError,
  });
}

export function useDeleteAvailability(options?: {
  onSuccess?: (variables: { id: string; scope?: 'single' | 'future' | 'all' }) => void;
  onError?: (error: Error) => void;
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
      queryClient.invalidateQueries({ queryKey: ['availability'] });

      // Remove the specific availability from cache
      queryClient.removeQueries({ queryKey: ['availability', variables.id] });

      options?.onSuccess?.(variables);
    },
    onError: options?.onError,
  });
}

export function useAcceptAvailabilityProposal(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: { id: string }) => void;
  onError?: (error: Error) => void;
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
        queryKey: ['availability', variables.id],
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(['availability', variables.id]);

      // Optimistically update status
      if (previousAvailability) {
        queryClient.setQueryData(['availability', variables.id], (old: any) => ({
          ...old,
          status: 'ACTIVE',
          acceptedAt: new Date().toISOString(),
        }));
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (data, variables) => {
      // Update the specific availability in cache
      queryClient.setQueryData(['availability', variables.id], data);

      // Invalidate provider and organization availability lists
      queryClient.invalidateQueries({ queryKey: ['availability', 'provider'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'organization'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'search'] });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousAvailability) {
        queryClient.setQueryData(
          ['availability', context.availabilityId],
          context.previousAvailability
        );
      }

      options?.onError?.(error);
    },
  });
}

export function useRejectAvailabilityProposal(options?: {
  onSuccess?: (variables: { id: string; reason?: string }) => void;
  onError?: (error: Error) => void;
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
        queryKey: ['availability', variables.id],
      });

      // Snapshot the previous value
      const previousAvailability = queryClient.getQueryData(['availability', variables.id]);

      // Optimistically update status
      if (previousAvailability) {
        queryClient.setQueryData(['availability', variables.id], (old: any) => ({
          ...old,
          status: 'REJECTED',
        }));
      }

      return { previousAvailability, availabilityId: variables.id };
    },
    onSuccess: (_, variables) => {
      // Invalidate provider and organization availability lists
      queryClient.invalidateQueries({ queryKey: ['availability', 'provider'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'organization'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'search'] });

      options?.onSuccess?.(variables);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousAvailability) {
        queryClient.setQueryData(
          ['availability', context.availabilityId],
          context.previousAvailability
        );
      }

      options?.onError?.(error);
    },
  });
}
