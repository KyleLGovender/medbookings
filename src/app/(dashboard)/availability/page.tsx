'use client';

import { useState } from 'react';

import { ProviderRequiredMessage } from '@/components/provider-required-message';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  SeriesActionDialog,
  type SeriesActionScope,
} from '@/features/calendar/components/availability/series-action-dialog';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import { useDeleteAvailability } from '@/features/calendar/hooks/use-availability';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { parseUTC } from '@/lib/timezone';
import { type RouterOutputs } from '@/utils/api';

type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];

export default function GlobalAvailabilityPage() {
  const { data: currentProvider, isLoading, error } = useCurrentUserProvider();
  const [seriesActionModalOpen, setSeriesActionModalOpen] = useState(false);
  const [pendingDeleteAvailability, setPendingDeleteAvailability] =
    useState<AvailabilityData | null>(null);
  const { toast } = useToast();

  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
      setPendingDeleteAvailability(null);
    },
  });

  const handleDeleteAvailability = (availability: AvailabilityData) => {
    // Check for existing bookings first
    const bookedSlots = availability.calculatedSlots?.filter((slot: any) => slot.booking) || [];
    if (bookedSlots.length > 0) {
      toast({
        title: 'Cannot Delete',
        description:
          'Cannot delete availability with existing bookings. Cancel the bookings first.',
        variant: 'destructive',
      });
      return;
    }

    setPendingDeleteAvailability(availability);

    // If it's a recurring series, show the series action dialog
    if (availability.isRecurring || availability.seriesId) {
      setSeriesActionModalOpen(true);
    } else {
      // Single availability - delete directly
      handleConfirmDelete('single');
    }
  };

  const handleConfirmDelete = async (scope: SeriesActionScope) => {
    if (!pendingDeleteAvailability || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync({
        ids: [pendingDeleteAvailability.id],
        scope,
      });
    } catch (error) {
      logger.error('Failed to delete availability', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Failed to delete',
        description: 'An error occurred while deleting the availability. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSeriesActionConfirm = (scope: SeriesActionScope) => {
    setSeriesActionModalOpen(false);
    handleConfirmDelete(scope);
  };

  const handleSeriesActionCancel = () => {
    setSeriesActionModalOpen(false);
    setPendingDeleteAvailability(null);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Your Calendar</h1>
            <p className="mt-2 text-sm text-gray-600">Loading your provider information...</p>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Loading your calendar...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !currentProvider) {
    return (
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProviderRequiredMessage
            description="To manage your calendar availability, you need to complete your provider profile setup. This includes your professional information, services, and regulatory requirements."
            className=""
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Calendar</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule across all contexts
          </p>
        </div>

        <ProviderCalendarView
          providerId={currentProvider.id}
          onCreateAvailability={() =>
            (window.location.href = `/availability/create?providerId=${currentProvider.id}&returnUrl=/availability`)
          }
          onEditAvailability={(availability) =>
            (window.location.href = `/availability/${availability.id}/edit?returnUrl=/availability`)
          }
          onDeleteAvailability={handleDeleteAvailability}
        />

        {/* Series Action Dialog for Delete */}
        <SeriesActionDialog
          isOpen={seriesActionModalOpen}
          onClose={handleSeriesActionCancel}
          onConfirm={handleSeriesActionConfirm}
          actionType="delete"
          availabilityTitle={
            pendingDeleteAvailability?.provider?.user?.name || 'Provider Availability'
          }
          availabilityDate={
            pendingDeleteAvailability?.startTime
              ? pendingDeleteAvailability.startTime.toLocaleDateString()
              : ''
          }
          isDestructive={true}
        />
      </div>
    </div>
  );
}
