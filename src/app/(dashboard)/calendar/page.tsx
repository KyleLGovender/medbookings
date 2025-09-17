'use client';

import React, { useMemo } from 'react';

import { CalendarDays, Clock, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { api } from '@/utils/api';

export default function CalendarOverviewPage() {
  const { data: currentProvider, isLoading: isProviderLoading } = useCurrentUserProvider();

  // Memoize the date range to prevent constant re-calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7); // Last week
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(now);
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
          <h1 className="text-3xl font-bold text-gray-900">Calendar Overview</h1>
          <p className="mt-2 text-sm text-gray-600">Loading your calendar dashboard...</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">Loading your calendar overview...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProvider) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Overview</h1>
          <p className="mt-2 text-sm text-gray-600">
            Provider profile required to view calendar overview
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-orange-600">
              Provider Profile Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To view your calendar overview, you need to complete your provider profile setup.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from availability data
  const todayBookings =
    availabilities?.reduce((count, availability) => {
      const today = new Date();
      return (
        count +
        (availability.calculatedSlots?.filter((slot: any) => {
          const slotDate = new Date(slot.startTime);
          return slotDate.toDateString() === today.toDateString() && slot.booking;
        }).length || 0)
      );
    }, 0) || 0;

  const weeklyBookings =
    availabilities?.reduce((count, availability) => {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return (
        count +
        (availability.calculatedSlots?.filter((slot: any) => {
          const slotDate = new Date(slot.startTime);
          return slotDate >= now && slotDate <= weekFromNow && slot.booking;
        }).length || 0)
      );
    }, 0) || 0;

  const availableSlots =
    availabilities?.reduce((count, availability) => {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return (
        count +
        (availability.calculatedSlots?.filter((slot: any) => {
          const slotDate = new Date(slot.startTime);
          return slotDate >= now && slotDate <= weekFromNow && !slot.booking;
        }).length || 0)
      );
    }, 0) || 0;

  const totalSlots = availableSlots + weeklyBookings;
  const utilizationRate = totalSlots > 0 ? Math.round((weeklyBookings / totalSlots) * 100) : 0;

  const mockStats = {
    todayBookings,
    weeklyBookings,
    availableSlots,
    utilizationRate,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendar Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your comprehensive calendar dashboard and booking insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.todayBookings === 0 ? 'No appointments today' : 'scheduled appointments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.weeklyBookings}</div>
            <p className="text-xs text-muted-foreground">total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.availableSlots}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">of available time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your calendar and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <a
                href="/availability"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">Manage Availability</div>
                  <div className="text-sm text-muted-foreground">Set your available time slots</div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </a>
              <a
                href="/calendar/availability"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">Advanced Availability</div>
                  <div className="text-sm text-muted-foreground">Bulk operations and rules</div>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest calendar updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availabilities && availabilities.length > 0 ? (
                availabilities.slice(0, 3).map((availability, index) => (
                  <a
                    key={availability.id || index}
                    href={`/availability/${availability.id}/edit?returnUrl=/calendar`}
                    className="group flex cursor-pointer items-start space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium transition-colors group-hover:text-blue-600">
                        {availability.status === 'ACCEPTED'
                          ? 'Available slots'
                          : 'Pending approval'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(availability.startTime).toLocaleDateString()} -{' '}
                        {availability.calculatedSlots?.length || 0} slots
                      </div>
                    </div>
                    <div className="self-center text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Edit
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent availability</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar Insights</CardTitle>
            <CardDescription>
              Performance metrics will appear here once you have booking data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Insights will be available after you create availability slots and start receiving
                bookings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
