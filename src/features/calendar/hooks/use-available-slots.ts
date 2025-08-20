import { useMemo } from 'react';

import { api } from '@/utils/api';
import { BookingFilters, BookingSlot, DateRange } from '@/features/calendar/types/booking-types';

interface UseAvailableSlotsParams {
  providerId: string;
  dateRange: DateRange;
  filters?: BookingFilters;
  enabled?: boolean;
}

export function useAvailableSlots({
  providerId,
  dateRange,
  filters = {},
  enabled = true,
}: UseAvailableSlotsParams) {
  // Query available slots from tRPC
  const query = api.calendar.getAvailableSlots.useQuery(
    {
      providerId,
      startDate: dateRange.start,
      endDate: dateRange.end,
      filters,
    },
    {
      enabled: enabled && !!providerId,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes for real-time updates
    }
  );

  // Transform API data to BookingSlot format
  const transformedSlots = useMemo(() => {
    if (!query.data) return [];

    return query.data.map((slot): BookingSlot => ({
      id: slot.id,
      availabilityId: slot.availabilityId,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      durationMinutes: slot.durationMinutes,
      isAvailable: !slot.isBooked && slot.startTime > new Date(), // Check if slot is available and in future
      price: slot.price ? parseFloat(slot.price.toString()) : undefined,
      service: slot.service ? {
        id: slot.service.id,
        name: slot.service.name,
        description: slot.service.description || undefined,
      } : undefined,
      provider: {
        id: slot.availability.provider.id,
        name: slot.availability.provider.user?.name || 'Provider',
        image: slot.availability.provider.user?.image || undefined,
      },
      location: slot.availability.location ? {
        id: slot.availability.location.id,
        name: slot.availability.location.name || 'Location',
        isOnline: slot.availability.isOnlineAvailable,
      } : undefined,
    }));
  }, [query.data]);

  // Filter slots based on current time (hide past slots for today)
  const filteredSlots = useMemo(() => {
    const now = new Date();
    return transformedSlots.filter(slot => {
      // Hide past time slots for current day
      const isToday = slot.startTime.toDateString() === now.toDateString();
      if (isToday && slot.startTime < now) {
        return false;
      }
      return true;
    });
  }, [transformedSlots]);

  return {
    data: filteredSlots,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}