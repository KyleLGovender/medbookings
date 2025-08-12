'use client';

import { useMemo } from 'react';

import { CalendarDataParams } from '@/features/calendar/types/types';
import { type RouterInputs, api } from '@/utils/api';

// =============================================================================
// tRPC TYPE EXTRACTION - OPTION C COMPLIANT
// =============================================================================

type AvailabilitySearchParams = RouterInputs['calendar']['searchAvailability'];

// =============================================================================
// INTERFACE DEFINITIONS FOR RETURN TYPE
// =============================================================================

interface ProviderCalendarData {
  provider: ReturnType<typeof api.providers.getById.useQuery>;
  availability: ReturnType<typeof api.calendar.searchAvailability.useQuery>;
}

interface CalendarDataResult {
  providers: Map<string, ProviderCalendarData>;
  isLoading: boolean;
  hasError: boolean;
}

// =============================================================================
// MAIN HOOK - THIN tRPC WRAPPER
// =============================================================================

/**
 * Standardized hook for fetching calendar data for multiple providers.
 * OPTION C COMPLIANT: Thin wrapper around tRPC queries with automatic type inference.
 *
 * @param params - Calendar data parameters with multiple provider IDs and date range
 * @returns Structured calendar data object with provider and availability data for each provider
 */
export function useCalendarData(params: CalendarDataParams): CalendarDataResult {
  const { providerIds, dateRange, statusFilter = 'ALL' } = params;

  // Create queries for each provider
  const providerQueries = providerIds.map(providerId => {
    // Fetch provider data using tRPC
    const providerQuery = api.providers.getById.useQuery(
      { id: providerId },
      {
        enabled: !!providerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    );

    // Build search parameters for availability
    const searchParams: AvailabilitySearchParams = {
      providerId,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      ...(statusFilter !== 'ALL' && { status: statusFilter }),
    };

    // Fetch availability data using tRPC
    const availabilityQuery = api.calendar.searchAvailability.useQuery(searchParams, {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
      providerId,
      provider: providerQuery,
      availability: availabilityQuery,
    };
  });

  // Build the structured calendarData object
  const calendarData = useMemo(() => {
    const providers = new Map<string, ProviderCalendarData>();
    
    providerQueries.forEach(({ providerId, provider, availability }) => {
      providers.set(providerId, {
        provider,
        availability,
      });
    });

    return providers;
  }, [providerQueries]);

  // Calculate combined loading and error states
  const isLoading = providerQueries.some(
    q => q.provider.isLoading || q.availability.isLoading
  );
  
  const hasError = providerQueries.some(
    q => !!q.provider.error || !!q.availability.error
  );

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
