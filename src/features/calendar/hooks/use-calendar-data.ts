'use client';

import { useMemo } from 'react';

import { CalendarDataParams } from '@/features/calendar/types/types';
import { type RouterInputs, type RouterOutputs, api } from '@/utils/api';

// =============================================================================
// tRPC TYPE EXTRACTION - OPTION C COMPLIANT
// =============================================================================

type AvailabilitySearchParams = RouterInputs['calendar']['searchAvailability'];

// =============================================================================
// OPTION B: BETTER-TYPED HOOK WITH EXPLICIT TYPE EXTRACTION
// =============================================================================

// Extract the actual data types from tRPC router
type ProviderData = RouterOutputs['providers']['getById'];
type AvailabilityData = RouterOutputs['calendar']['searchAvailability'];

// Individual provider's calendar data with proper types
interface ProviderCalendarData {
  provider: {
    data: ProviderData | undefined;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: any;
    refetch: () => void;
  };
  availability: {
    data: AvailabilityData | undefined;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: any;
    refetch: () => void;
  };
}

// Return type with proper type safety
interface CalendarDataResult {
  providers: Map<string, ProviderCalendarData>;
  isLoading: boolean;
  hasError: boolean;
}

// =============================================================================
// MAIN HOOK - THIN tRPC WRAPPER
// =============================================================================

/**
 * OPTION B: Better-typed hook for fetching calendar data for multiple providers.
 * Provides explicit type safety throughout the entire data flow.
 *
 * @param params - Calendar data parameters with multiple provider IDs and date range
 * @returns Structured calendar data with fully typed provider and availability data
 */
export function useCalendarData(params: CalendarDataParams): CalendarDataResult {
  const { providerIds, dateRange, statusFilter = 'ALL' } = params;

  // Create stable string representations of dates to prevent constant re-queries
  // CRITICAL FIX: Memoize the date strings based on the date objects themselves
  // Since Date objects are stable within a render, we can use them directly
  const startDateString = useMemo(() => dateRange.start.toISOString(), [dateRange.start]);
  const endDateString = useMemo(() => dateRange.end.toISOString(), [dateRange.end]);

  // Create stable search parameters to prevent constant re-queries
  const stableSearchParams = useMemo(() => {
    return providerIds.map((providerId) => ({
      providerId,
      startDate: startDateString,
      endDate: endDateString,
      ...(statusFilter !== 'ALL' && { status: statusFilter }),
    }));
  }, [providerIds, startDateString, endDateString, statusFilter]);

  // Create queries for each provider
  const providerQueries = providerIds.map((providerId, index) => {
    // Fetch provider data using tRPC
    const providerQuery = api.providers.getById.useQuery(
      { id: providerId },
      {
        enabled: !!providerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    );

    // Use stable search parameters
    const searchParams = stableSearchParams[index] as AvailabilitySearchParams;

    // Fetch availability data using tRPC with optimized caching
    const availabilityQuery = api.calendar.searchAvailability.useQuery(searchParams, {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
      refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 2, // Limit retry attempts
    });

    return {
      providerId,
      provider: providerQuery,
      availability: availabilityQuery,
    };
  });

  // Build the structured calendarData object with proper type mapping
  const calendarData = useMemo(() => {
    const providers = new Map<string, ProviderCalendarData>();

    providerQueries.forEach(({ providerId, provider, availability }) => {
      // Explicitly type the queries to ensure type safety
      providers.set(providerId, {
        provider: {
          data: provider.data as ProviderData | undefined,
          isLoading: provider.isLoading,
          isSuccess: provider.isSuccess,
          isError: provider.isError,
          error: provider.error,
          refetch: provider.refetch,
        },
        availability: {
          data: availability.data as AvailabilityData | undefined,
          isLoading: availability.isLoading,
          isSuccess: availability.isSuccess,
          isError: availability.isError,
          error: availability.error,
          refetch: availability.refetch,
        },
      });
    });

    return providers;
  }, [providerQueries]);

  // Calculate combined loading and error states
  const isLoading = providerQueries.some((q) => q.provider.isLoading || q.availability.isLoading);

  const hasError = providerQueries.some((q) => !!q.provider.error || !!q.availability.error);

  return {
    providers: calendarData,
    isLoading,
    hasError,
  };
}

// =============================================================================
// UTILITY HOOKS - THIN tRPC WRAPPERS
// =============================================================================

/**
 * Hook for provider availability with proper tRPC caching
 */
export function useProviderAvailability(providerId: string | undefined) {
  return api.calendar.getByProviderId.useQuery(
    { providerId: providerId || '' },
    {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for organization availability with proper tRPC caching
 */
export function useOrganizationAvailability(organizationId: string | undefined) {
  return api.calendar.getByOrganizationId.useQuery(
    { organizationId: organizationId || '' },
    {
      enabled: !!organizationId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for series availability with proper tRPC caching
 */
export function useAvailabilitySeries(seriesId: string | undefined) {
  return api.calendar.getBySeriesId.useQuery(
    { seriesId: seriesId || '' },
    {
      enabled: !!seriesId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for invalidating calendar data caches using tRPC utils.
 */
export function useInvalidateCalendarData() {
  const utils = api.useUtils();

  return {
    invalidateAll: () => {
      utils.calendar.invalidate();
    },
    invalidateProvider: (providerId: string) => {
      utils.calendar.getByProviderId.invalidate({ providerId });
      utils.calendar.searchAvailability.invalidate();
    },
    invalidateOrganization: (organizationId: string) => {
      utils.calendar.getByOrganizationId.invalidate({ organizationId });
      utils.calendar.searchAvailability.invalidate();
    },
    invalidateSeries: (seriesId: string) => {
      utils.calendar.getBySeriesId.invalidate({ seriesId });
    },
  };
}
