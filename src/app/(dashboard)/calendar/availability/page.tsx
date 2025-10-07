'use client';

import React, { useMemo, useState } from 'react';

import { Calendar, Clock, Download, Plus, Settings, Upload } from 'lucide-react';

import { ProviderRequiredMessage } from '@/components/provider-required-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SeriesActionDialog,
  type SeriesActionScope,
} from '@/features/calendar/components/availability/series-action-dialog';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import { useDeleteAvailability } from '@/features/calendar/hooks/use-availability';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { nowUTC, parseUTC } from '@/lib/timezone';
import { type RouterOutputs, api } from '@/utils/api';

type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];
type CalculatedSlot = NonNullable<AvailabilityData['calculatedSlots']>[number];

export default function AvailabilityManagementPage() {
  const { data: currentProvider, isLoading: isProviderLoading } = useCurrentUserProvider();
  const [activeTab, setActiveTab] = useState('calendar');
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
    const bookedSlots =
      availability.calculatedSlots?.filter((slot: CalculatedSlot) => slot.booking) || [];
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

  // Memoize the date range to prevent constant re-calculation
  const dateRange = useMemo(() => {
    const now = nowUTC();
    const startDate = nowUTC();
    startDate.setDate(startDate.getDate() - 7); // Last week
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = nowUTC();
    endDate.setDate(endDate.getDate() + 30); // Next month
    endDate.setHours(23, 59, 59, 999); // End of day

    return { startDate, endDate };
  }, []); // Empty dependency array - only calculate once per component mount

  // Get availability data for the current provider
  const { data: availabilities } = api.calendar.searchAvailability.useQuery(
    {
      providerId: currentProvider?.id!,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: !!currentProvider?.id,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
    }
  );

  if (isProviderLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Loading your availability management dashboard...
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                Loading your availability dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProvider) {
    return (
      <ProviderRequiredMessage description="To manage your availability, you need to complete your provider profile setup." />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Advanced tools for managing your schedule and availability
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement import functionality
                alert('Import functionality coming soon');
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement export functionality
                alert('Export functionality coming soon');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Interactive Calendar
              </CardTitle>
              <CardDescription>
                View and manage your availability directly on the calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderCalendarView
                providerId={currentProvider.id}
                onCreateAvailability={() =>
                  (window.location.href = `/availability/create?providerId=${currentProvider.id}&returnUrl=/calendar/availability`)
                }
                onEditAvailability={(availability) =>
                  (window.location.href = `/availability/${availability.id}/edit`)
                }
                onDeleteAvailability={handleDeleteAvailability}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Perform operations on multiple availability slots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => alert('Bulk operations feature coming soon')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Copy Week to Future Dates
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => alert('Recurring schedule feature coming soon')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Recurring Schedule
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => alert('Bulk update feature coming soon')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Update Multiple Slots
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => alert('Bulk delete feature coming soon')}
                >
                  Delete Selected Slots
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Overview of your availability data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Availabilities</span>
                  <span className="text-sm font-medium">{availabilities?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active This Week</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter((a) => {
                      const now = nowUTC();
                      const weekFromNow = nowUTC();
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      const startDate = a.startTime;
                      return startDate >= now && startDate <= weekFromNow;
                    }).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending Approval</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter((a) => a.status === 'PENDING').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Accepted</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter((a) => a.status === 'ACCEPTED').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Standard Week</CardTitle>
                <CardDescription>Monday-Friday, 9 AM - 5 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => alert('Template feature coming soon')}
                >
                  Apply Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Part-Time</CardTitle>
                <CardDescription>Monday, Wednesday, Friday, 10 AM - 3 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => alert('Template feature coming soon')}
                >
                  Apply Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekends Only</CardTitle>
                <CardDescription>Saturday-Sunday, 8 AM - 4 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => alert('Template feature coming soon')}
                >
                  Apply Template
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Templates</CardTitle>
              <CardDescription>Create and save your own availability templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => alert('Custom templates feature coming soon')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>Configure default availability preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Duration</label>
                  <select className="w-full rounded-md border p-2">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheduling Rule</label>
                  <select className="w-full rounded-md border p-2">
                    <option>Continuous</option>
                    <option>On the hour</option>
                    <option>On the half hour</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buffer Time</label>
                  <select className="w-full rounded-md border p-2">
                    <option>No buffer</option>
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure availability notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">New booking notifications</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Cancellation notifications</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Reminder notifications</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Daily availability summary</label>
                  <input type="checkbox" className="rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
  );
}
