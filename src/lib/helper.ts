import { api } from '@/utils/api';

export const getServiceProviderQuery = () =>
  api.providers.getCurrentProvider.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
