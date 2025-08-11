'use client';

import { useMemo } from 'react';
import { BookingStatus } from '@prisma/client';

import { api, type RouterInputs, type RouterOutputs } from '@/utils/api';
import { AvailabilityStatus } from '@prisma/client';

import { calculateDateRange } from '@/features/calendar/lib/calendar-utils';
import { CalendarViewMode } from '@/features/calendar/types/types';

// =============================================================================
// tRPC TYPE EXTRACTION - OPTION C COMPLIANT
// =============================================================================

type ProviderData = RouterOutputs['providers']['getById'];
type AvailabilityData = RouterOutputs['calendar']['searchAvailability'];
type AvailabilitySearchParams = RouterInputs['calendar']['searchAvailability'];

// =============================================================================
// INTERFACE DEFINITIONS FOR UI COMPONENTS
// =============================================================================

interface CalendarDataParams {
  providerId: string;
  currentDate: Date;
  viewMode: CalendarViewMode;
  statusFilter?: AvailabilityStatus | 'ALL';
}

// =============================================================================
// MAIN HOOK - THIN tRPC WRAPPER
// =============================================================================

/**
 * Standardized hook for fetching calendar data using tRPC procedures.
 * OPTION C COMPLIANT: Thin wrapper around tRPC queries with automatic type inference.
 *
 * @param params - Calendar data parameters
 * @returns Calendar data with loading and error states from tRPC
 */
export function useCalendarData(params: CalendarDataParams) {
  const { providerId, currentDate, viewMode, statusFilter = 'ALL' } = params;

  // Memoize date range calculation
  const dateRange = useMemo(() => {
    return calculateDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Fetch provider data using tRPC
  const providerQuery = api.providers.getById.useQuery(
    { id: providerId },
    {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Build search parameters for availability
  const searchParams: AvailabilitySearchParams = useMemo(() => ({
    providerId,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
  }), [providerId, dateRange.start, dateRange.end, statusFilter]);

  // Fetch availability data using tRPC
  const availabilityQuery = api.calendar.searchAvailability.useQuery(
    searchParams,
    {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Return raw tRPC query results with computed date range
  return {
    provider: providerQuery,
    availability: availabilityQuery,
    dateRange,
    isLoading: providerQuery.isLoading || availabilityQuery.isLoading,
    error: providerQuery.error || availabilityQuery.error,
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