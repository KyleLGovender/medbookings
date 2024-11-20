export const getServiceProviderQuery = {
  queryKey: ['authenticatedServiceProvider'],
  queryFn: async () => {
    const response = await fetch('/api/service-provider/me');
    if (!response.ok) {
      throw new Error('Failed to fetch service provider');
    }
    return response.json() as Promise<{
      serviceProviderId?: string;
      error?: string;
    }>;
  },
  retry: 1,
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
};
