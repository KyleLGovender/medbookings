import { api } from '@/utils/api';

interface UseProviderSlotsParams {
  providerId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  serviceId?: string;
}

export function useProviderSlots({ providerId, dateRange }: UseProviderSlotsParams) {
  // Fetch provider data
  const providerQuery = api.providers.getById.useQuery(
    { id: providerId },
    {
      enabled: !!providerId,
    }
  );

  // Fetch available slots for the provider
  const slotsQuery = api.calendar.getProviderSlots.useQuery(
    {
      providerId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    },
    {
      enabled: !!providerId && !!dateRange.start && !!dateRange.end,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    }
  );

  return {
    data: slotsQuery.data,
    isLoading: providerQuery.isLoading || slotsQuery.isLoading,
    error: providerQuery.error || slotsQuery.error,
    provider: providerQuery.data,
    refetch: () => {
      providerQuery.refetch();
      slotsQuery.refetch();
    },
  };
}
