/**
 * useCalendarSync Hook
 *
 * Encapsulates calendar sync logic and state management for provider Google Calendar integration.
 * Provides methods to trigger manual sync, check sync status, and handle real-time updates.
 */
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

interface UseCalendarSyncParams {
  providerId: string;
  /**
   * Refresh interval in milliseconds
   * Default: 5000 (5 seconds for real-time updates)
   */
  refetchInterval?: number;
}

export function useCalendarSync({ providerId, refetchInterval = 5000 }: UseCalendarSyncParams) {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Query sync status with real-time updates
  const statusQuery = api.calendarSync.getSyncStatus.useQuery(
    { providerId, limit: 20 },
    {
      enabled: !!providerId,
      refetchInterval, // Real-time refresh (default 5s)
      staleTime: refetchInterval, // Consider data stale after refresh interval
      refetchOnWindowFocus: true,
    }
  );

  // Mutation for triggering manual sync
  const syncMutation = api.calendarSync.syncGoogleCalendar.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Sync Completed',
        description: `Successfully processed ${data.eventsProcessed || 0} events`,
      });

      // Invalidate queries to refresh data
      void utils.calendarSync.getSyncStatus.invalidate({ providerId });
    },
    onError: (error) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync calendar',
        variant: 'destructive',
      });
    },
  });

  // Mutation for canceling sync operation
  const cancelSyncMutation = api.calendarSync.cancelSync.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sync Canceled',
        description: 'Calendar sync operation has been canceled',
      });

      void utils.calendarSync.getSyncStatus.invalidate({ providerId });
    },
    onError: (error) => {
      toast({
        title: 'Cancel Failed',
        description: error.message || 'Failed to cancel sync operation',
        variant: 'destructive',
      });
    },
  });

  // Mutation for disconnecting calendar integration
  const disconnectMutation = api.calendarSync.disconnectProviderCalendar.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Calendar Disconnected',
        description: `Calendar integration removed. ${data.slotsUnblocked} ${data.slotsUnblocked === 1 ? 'slot is' : 'slots are'} now available.`,
      });

      // Invalidate queries to refresh data (will show as not integrated)
      void utils.calendarSync.getSyncStatus.invalidate({ providerId });
    },
    onError: (error) => {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect calendar',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    status: statusQuery.data,
    integrated: !!statusQuery.data?.integration,
    integration: statusQuery.data?.integration || null,
    recentOperations: statusQuery.data?.recentOperations || [],

    // Loading states
    isLoading: statusQuery.isLoading,
    isSyncing: syncMutation.isPending,
    isCanceling: cancelSyncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,

    // Error states
    error:
      statusQuery.error ||
      syncMutation.error ||
      cancelSyncMutation.error ||
      disconnectMutation.error,

    // Actions
    sync: (operationType: 'FULL_SYNC' | 'INCREMENTAL_SYNC', syncWindowDays = 90) =>
      syncMutation.mutateAsync({
        providerId,
        operationType,
        syncWindowDays,
      }),

    cancelSync: (syncOperationId: string) => cancelSyncMutation.mutateAsync({ syncOperationId }),

    disconnect: () => disconnectMutation.mutateAsync({ providerId }),

    refetch: () => statusQuery.refetch(),
  };
}
