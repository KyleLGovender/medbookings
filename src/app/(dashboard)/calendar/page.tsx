'use client';

import React from 'react';

import { CalendarDays, Clock, Users, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { api } from '@/utils/api';

export default function CalendarOverviewPage() {
  const { data: currentProvider, isLoading: isProviderLoading } = useCurrentUserProvider();

  // Get availability data for the current provider (using existing API)
  const { data: availabilities } = api.calendar.searchAvailability.useQuery(
    {
      providerId: currentProvider?.id!,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // Next month
    },
    { enabled: !!currentProvider?.id }
  );

  if (isProviderLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Overview</h1>
          <p className="mt-2 text-sm text-gray-600">Loading your calendar dashboard...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="h-4 w-4 animate-pulse bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
  const todayBookings = availabilities?.reduce((count, availability) => {
    const today = new Date();
    return count + (availability.calculatedSlots?.filter((slot: any) => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === today.toDateString() && slot.booking;
    }).length || 0);
  }, 0) || 0;

  const weeklyBookings = availabilities?.reduce((count, availability) => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return count + (availability.calculatedSlots?.filter((slot: any) => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= now && slotDate <= weekFromNow && slot.booking;
    }).length || 0);
  }, 0) || 0;

  const availableSlots = availabilities?.reduce((count, availability) => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return count + (availability.calculatedSlots?.filter((slot: any) => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= now && slotDate <= weekFromNow && !slot.booking;
    }).length || 0);
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Manage Availability</div>
                  <div className="text-sm text-muted-foreground">Set your available time slots</div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </a>
              <a
                href="/calendar/availability"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Advanced Availability</div>
                  <div className="text-sm text-muted-foreground">Bulk operations and rules</div>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </a>
              <a
                href={`/providers/${currentProvider.id}/manage-calendar`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Calendar Management</div>
                  <div className="text-sm text-muted-foreground">Full calendar interface</div>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
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
                  <div key={availability.id || index} className="flex items-start space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {availability.status === 'ACCEPTED' ? 'Available slots' : 'Pending approval'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(availability.startTime).toLocaleDateString()} - {availability.calculatedSlots?.length || 0} slots
                      </div>
                    </div>
                  </div>
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
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Peak booking times</span>
                <span className="text-sm font-medium">9-11 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average session length</span>
                <span className="text-sm font-medium">30 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Booking lead time</span>
                <span className="text-sm font-medium">3 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">No-show rate</span>
                <span className="text-sm font-medium">5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}