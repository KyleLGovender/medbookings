'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useProvider } from '@/features/providers/hooks/use-provider';
import { 
  useAvailabilitySearch,
  availabilityKeys,
} from '@/features/calendar/hooks/use-availability';
import {
  AvailabilityStatus,
  AvailabilityWithRelations,
  CalculatedAvailabilitySlotWithRelations,
  CalendarEvent,
  CalendarViewMode,
  SchedulingRule,
} from '@/features/calendar/types/types';
import { calculateDateRange } from '@/features/calendar/lib/calendar-utils';

// =============================================================================
// TYPES
// =============================================================================

interface CalendarDataParams {
  providerId: string;
  currentDate: Date;
  viewMode: CalendarViewMode;
  statusFilter?: AvailabilityStatus | 'ALL';
}

interface CalendarData {
  providerId: string;
  providerName: string;
  providerType: string;
  workingHours: { start: string; end: string };
  events: CalendarEvent[];
  stats: {
    totalAvailabilityHours: number;
    bookedHours: number;
    utilizationRate: number;
    pendingBookings: number;
    completedBookings: number;
  };
  dateRange: { start: Date; end: Date };
}

// Client-safe enum (matches Prisma BookingStatus)
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Standardized hook for fetching and transforming calendar data.
 * Provides consistent caching, error handling, and data transformation
 * for all calendar components.
 * 
 * @param params - Calendar data parameters
 * @returns Calendar data with loading and error states
 */
export function useCalendarData(params: CalendarDataParams) {
  const { providerId, currentDate, viewMode, statusFilter = 'ALL' } = params;

  // Memoize date range calculation
  const dateRange = useMemo(() => {
    return calculateDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Fetch provider data with standardized caching
  const { 
    data: provider, 
    isLoading: isProviderLoading,
    error: providerError 
  } = useProvider(providerId);

  // Fetch availability data with standardized caching
  const { 
    data: availabilityData, 
    isLoading: isAvailabilityLoading,
    error: availabilityError 
  } = useAvailabilitySearch({
    providerId,
    startDate: dateRange.start,
    endDate: dateRange.end,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
  });

  // Transform data with optimized memoization
  const calendarData: CalendarData | null = useMemo(() => {
    if (!provider || !availabilityData) return null;

    // Transform availability records into calendar events
    const events: CalendarEvent[] = [];

    // Add availability blocks
    availabilityData.forEach((availability: AvailabilityWithRelations) => {
      // Determine creator information
      const isProviderCreated =
        availability.isProviderCreated ||
        (!availability.organizationId && !availability.createdByMembershipId);

      const event: CalendarEvent = {
        id: availability.id,
        type: 'availability' as const,
        title: availability.availableServices?.[0]?.service?.name || 'General Consultation',
        startTime: new Date(availability.startTime),
        endTime: new Date(availability.endTime),
        status: availability.status,
        schedulingRule: availability.schedulingRule as SchedulingRule,
        isRecurring: availability.isRecurring,
        seriesId: availability.seriesId || undefined,
        location: availability.location
          ? {
              id: availability.location.id,
              name: availability.location.name,
              isOnline: !availability.locationId,
            }
          : undefined,
        service: availability.availableServices?.[0]
          ? {
              id: availability.availableServices[0].service.id,
              name: availability.availableServices[0].service.name,
              duration: availability.availableServices[0].duration || 30,
              price: Number(availability.availableServices[0].price) || 0,
            }
          : undefined,
        // Creator information
        isProviderCreated,
        createdBy: availability.createdBy
          ? {
              id: availability.createdBy.id,
              name: availability.createdBy.name || 'Unknown',
              type: isProviderCreated ? 'provider' : 'organization',
            }
          : undefined,
        organization: availability.organization
          ? {
              id: availability.organization.id,
              name: availability.organization.name,
            }
          : undefined,
      };

      events.push(event);

      // Add booked slots from this availability's calculated slots
      availability.calculatedSlots
        ?.filter((slot) => slot.status === 'BOOKED')
        .forEach((slot) => {
          events.push({
            id: slot.id,
            type: 'booking' as const,
            title: slot.service?.name || 'Appointment',
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            status: slot.status,
            schedulingRule: availability.schedulingRule as SchedulingRule,
            isRecurring: false,
            location: slot.serviceConfig?.location
              ? {
                  id: slot.serviceConfig.location.id,
                  name: slot.serviceConfig.location.name,
                  isOnline: slot.serviceConfig.isOnlineAvailable,
                }
              : undefined,
            service:
              slot.service && slot.serviceConfig
                ? {
                    id: slot.service.id,
                    name: slot.service.name,
                    duration: slot.serviceConfig.duration || 30,
                    price: Number(slot.serviceConfig.price) || 0,
                  }
                : undefined,
            // Customer data will be populated when booking relationship is available
          });
        });
    });

    // Calculate stats from all calculated slots
    const allSlots = availabilityData.flatMap(
      (availability: AvailabilityWithRelations) => availability.calculatedSlots || []
    );
    const bookedSlots = allSlots.filter(
      (slot: CalculatedAvailabilitySlotWithRelations) => slot.status === 'BOOKED'
    ).length;
    const pendingSlots = allSlots.filter(
      (slot: CalculatedAvailabilitySlotWithRelations) =>
        slot.booking?.status === BookingStatus.PENDING
    ).length;

    return {
      providerId,
      providerName: provider.name,
      providerType: 'Healthcare Provider', // TODO: Add type information to SerializedProvider
      workingHours: { start: '09:00', end: '17:00' }, // Default working hours
      events,
      stats: {
        totalAvailabilityHours: availabilityData.length,
        bookedHours: bookedSlots,
        utilizationRate:
          allSlots.length > 0 ? Math.round((bookedSlots / allSlots.length) * 100) : 0,
        pendingBookings: pendingSlots,
        completedBookings: bookedSlots,
      },
      dateRange,
    };
  }, [provider, availabilityData, providerId, dateRange]);

  // Memoize filtered events for performance
  const filteredEvents = useMemo(() => {
    if (!calendarData?.events) return [];
    
    return calendarData.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= dateRange.start && eventDate <= dateRange.end;
    });
  }, [calendarData?.events, dateRange]);

  return {
    data: calendarData,
    filteredEvents,
    isLoading: isProviderLoading || isAvailabilityLoading,
    error: providerError || availabilityError,
    dateRange,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for invalidating calendar data caches.
 * Useful for mutations that affect calendar data.
 */
export function useInvalidateCalendarData() {
  const { useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
    invalidateProvider: (providerId: string) => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.provider(providerId) });
    },
    invalidateSearch: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'availability' && query.queryKey[1] === 'search'
      });
    },
  };
}