import { useMemo } from 'react';

import { api, type RouterOutputs } from '@/utils/api';

interface UseProviderSlotsParams {
  providerId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  serviceId?: string;
}

export function useProviderSlots({ providerId, dateRange, serviceId }: UseProviderSlotsParams) {
  // Fetch provider data
  const providerQuery = api.providers.getById.useQuery(
    { id: providerId },
    {
      enabled: !!providerId,
    }
  );

  // Fetch available slots for the provider
  const slotsQuery = api.calendar.getAvailableSlots.useQuery(
    {
      providerId,
      startDate: dateRange.start,
      endDate: dateRange.end,
      serviceId,
    },
    {
      enabled: !!providerId && !!dateRange.start && !!dateRange.end,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    }
  );

  // Extract available services from provider data
  const availableServices = useMemo(() => {
    const provider = providerQuery.data;
    if (!provider?.services) return [];

    return provider.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.defaultPrice || 0),
    }));
  }, [providerQuery.data]);

  // Filter slots by service if specified
  const filteredSlots = useMemo(() => {
    const slots = slotsQuery.data || [];
    if (!serviceId || serviceId === 'ALL') return slots;

    return slots.filter((slot) => slot.service?.id === serviceId);
  }, [slotsQuery.data, serviceId]);

  // Hide past time slots for current day
  const currentSlots = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return filteredSlots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());

      // If slot is today, only show future slots
      if (slotDay.getTime() === today.getTime()) {
        return slotDate.getTime() > now.getTime();
      }

      // For other days, show all slots
      return true;
    });
  }, [filteredSlots]);

  // Enforce 3-day advance booking limit
  const availableSlots = useMemo(() => {
    const now = new Date();
    const maxAdvanceDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    return currentSlots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return slotDate <= maxAdvanceDate;
    });
  }, [currentSlots]);

  return {
    data: availableSlots,
    isLoading: providerQuery.isLoading || slotsQuery.isLoading,
    error: providerQuery.error || slotsQuery.error,
    provider: providerQuery.data,
    availableServices,
    refetch: () => {
      providerQuery.refetch();
      slotsQuery.refetch();
    },
  };
}