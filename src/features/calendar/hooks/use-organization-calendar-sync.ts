import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

interface UseOrganizationCalendarSyncParams {
  /**
   * ID of the organization
   */
  organizationId: string;
  /**
   * Optional location ID for location-specific sync
   */
  locationId?: string;
  /**
   * Refetch interval in milliseconds
   * @default 5000 (5 seconds for real-time updates)
   */
  refetchInterval?: number;
}

/**
 * useOrganizationCalendarSync Hook
 *
 * Custom hook for managing organization calendar sync operations.
 *
 * Features:
 * - Fetch organization sync status and recent operations
 * - Trigger manual organization calendar sync
 * - Cancel running sync operations
 * - Real-time updates with configurable refetch interval
 * - Toast notifications for sync success/failure
 *
 * @example
 * ```tsx
 * const { status, integrated, sync, isSyncing } = useOrganizationCalendarSync({
 *   organizationId: org.id,
 *   locationId: location.id,
 *   refetchInterval: 5000,
 * });
 * ```
 */
export function useOrganizationCalendarSync({
  organizationId,
  locationId,
  refetchInterval = 5000,
}: UseOrganizationCalendarSyncParams) {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Query organization sync status with real-time updates
  const statusQuery = api.calendarSync.getOrganizationSyncStatus.useQuery(
    { organizationId, locationId, limit: 20 },
    {
      enabled: !!organizationId,
      refetchInterval,
      staleTime: refetchInterval,
      refetchOnWindowFocus: true,
    }
  );

  // Mutation for triggering manual organization sync
  const syncMutation = api.calendarSync.syncOrganizationCalendar.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Sync Completed',
        description: `Successfully processed ${data.eventsProcessed || 0} events`,
      });
      void utils.calendarSync.getOrganizationSyncStatus.invalidate({
        organizationId,
        locationId,
      });
    },
    onError: (error) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync organization calendar',
        variant: 'destructive',
      });
    },
  });

  // Mutation for canceling sync operations
  const cancelSyncMutation = api.calendarSync.cancelOrganizationSync.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sync Cancelled',
        description: 'Calendar sync operation has been cancelled',
      });
      void utils.calendarSync.getOrganizationSyncStatus.invalidate({
        organizationId,
        locationId,
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancel Failed',
        description: error.message || 'Failed to cancel sync operation',
        variant: 'destructive',
      });
    },
  });

  // Mutation for disconnecting single calendar integration
  const disconnectMutation = api.calendarSync.disconnectOrganizationCalendar.useMutation({
    onSuccess: (data) => {
      const locationText = locationId ? 'location calendar' : 'organization calendar';
      toast({
        title: 'Calendar Disconnected',
        description: `${locationText} integration removed. ${data.slotsUnblocked} ${data.slotsUnblocked === 1 ? 'slot is' : 'slots are'} now available.`,
      });
      void utils.calendarSync.getOrganizationSyncStatus.invalidate({
        organizationId,
        locationId,
      });
    },
    onError: (error) => {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect calendar',
        variant: 'destructive',
      });
    },
  });

  // Mutation for disconnecting ALL calendar integrations (bulk)
  const bulkDisconnectMutation = api.calendarSync.disconnectAllOrganizationCalendars.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'All Calendars Disconnected',
        description: `Disconnected ${data.totalDisconnected} location${data.totalDisconnected !== 1 ? 's' : ''}. ${data.totalSlotsUnblocked} ${data.totalSlotsUnblocked === 1 ? 'slot is' : 'slots are'} now available.`,
      });
      void utils.calendarSync.getOrganizationSyncStatus.invalidate({
        organizationId,
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk Disconnect Failed',
        description: error.message || 'Failed to disconnect all calendars',
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
    isDisconnecting: disconnectMutation.isPending || bulkDisconnectMutation.isPending,

    // Actions
    sync: (operationType: 'FULL_SYNC' | 'INCREMENTAL_SYNC', syncWindowDays = 90) =>
      syncMutation.mutateAsync({ organizationId, locationId, operationType, syncWindowDays }),
    cancelSync: (syncOperationId: string) => cancelSyncMutation.mutateAsync({ syncOperationId }),
    disconnect: () => disconnectMutation.mutateAsync({ organizationId, locationId }),
    disconnectAll: () => bulkDisconnectMutation.mutateAsync({ organizationId }),
    refetch: () => statusQuery.refetch(),
  };
}
