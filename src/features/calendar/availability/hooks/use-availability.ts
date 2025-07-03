'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateAvailabilityData,
  UpdateAvailabilityData,
  AvailabilitySearchParams,
  AvailabilityWithRelations,
} from '../types';
import {
  createAvailability,
  getAvailabilityById,
  searchAvailability,
  updateAvailability,
  deleteAvailability,
  acceptAvailabilityProposal,
  rejectAvailabilityProposal,
} from '../lib/actions';

// Query hooks
export function useAvailabilityById(availabilityId: string | undefined) {
  return useQuery({
    queryKey: ['availability', availabilityId],
    queryFn: async () => {
      if (!availabilityId) {
        throw new Error('Availability ID is required');
      }
      
      const result = await getAvailabilityById(availabilityId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability');
      }
      
      return result.data;
    },
    enabled: !!availabilityId,
  });
}

export function useAvailabilitySearch(params: AvailabilitySearchParams) {
  return useQuery({
    queryKey: ['availability', 'search', params],
    queryFn: async () => {
      const result = await searchAvailability(params);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search availability');
      }
      
      return result.data || [];
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
      
      const result = await searchAvailability({ serviceProviderId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch provider availability');
      }
      
      return result.data || [];
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
      
      const result = await searchAvailability({ organizationId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch organization availability');
      }
      
      return result.data || [];
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
      
      const result = await searchAvailability({ seriesId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability series');
      }
      
      return result.data || [];
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
      const result = await createAvailability(data);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create availability');
      }
      
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'provider', variables.serviceProviderId] });
      
      if (variables.organizationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['availability', 'organization', variables.organizationId] 
        });
      }
      
      if (variables.seriesId) {
        queryClient.invalidateQueries({ 
          queryKey: ['availability', 'series', variables.seriesId] 
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

export function useUpdateAvailability(options?: {
  onSuccess?: (data: AvailabilityWithRelations, variables: UpdateAvailabilityData) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<AvailabilityWithRelations, Error, UpdateAvailabilityData>({
    mutationFn: async (data) => {
      const result = await updateAvailability(data);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update availability');
      }
      
      return result.data;
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
          queryKey: ['availability', 'series', data.seriesId] 
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

export function useDeleteAvailability(options?: {
  onSuccess?: (variables: { id: string }) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const result = await deleteAvailability(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete availability');
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

  return useMutation<AvailabilityWithRelations, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const result = await acceptAvailabilityProposal(id);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to accept availability proposal');
      }
      
      return result.data;
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

  return useMutation<void, Error, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      const result = await rejectAvailabilityProposal(id, reason);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject availability proposal');
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