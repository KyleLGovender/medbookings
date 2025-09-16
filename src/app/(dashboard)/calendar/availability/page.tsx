'use client';

import React, { useState } from 'react';

import { Calendar, Clock, Plus, Settings, Upload, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { api } from '@/utils/api';

export default function AvailabilityManagementPage() {
  const { data: currentProvider, isLoading: isProviderLoading } = useCurrentUserProvider();
  const [activeTab, setActiveTab] = useState('calendar');

  // Get availability data for the current provider
  const { data: availabilities, isLoading: isAvailabilityLoading } = api.calendar.searchAvailability.useQuery(
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
          <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
          <p className="mt-2 text-sm text-gray-600">Loading your availability management dashboard...</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!currentProvider) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Provider profile required to manage availability
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
              To manage your availability, you need to complete your provider profile setup.
            </p>
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/profile'}>
                Complete Provider Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Availability
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
                onCreateAvailability={() => window.location.href = '/availability/create'}
                onEditAvailability={(availability) => window.location.href = `/availability/${availability.id}/edit`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>
                  Perform operations on multiple availability slots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Copy Week to Future Dates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Recurring Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Multiple Slots
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  Delete Selected Slots
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Overview of your availability data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Availabilities</span>
                  <span className="text-sm font-medium">
                    {availabilities?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active This Week</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter(a => {
                      const now = new Date();
                      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                      const startDate = new Date(a.startTime);
                      return startDate >= now && startDate <= weekFromNow;
                    }).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending Approval</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter(a => a.status === 'PENDING').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Accepted</span>
                  <span className="text-sm font-medium">
                    {availabilities?.filter(a => a.status === 'ACCEPTED').length || 0}
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
                <CardDescription>
                  Monday-Friday, 9 AM - 5 PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Part-Time</CardTitle>
                <CardDescription>
                  Monday, Wednesday, Friday, 10 AM - 3 PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekends Only</CardTitle>
                <CardDescription>
                  Saturday-Sunday, 8 AM - 4 PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Templates</CardTitle>
              <CardDescription>
                Create and save your own availability templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                <CardDescription>
                  Configure default availability preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Duration</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheduling Rule</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Continuous</option>
                    <option>On the hour</option>
                    <option>On the half hour</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buffer Time</label>
                  <select className="w-full p-2 border rounded-md">
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
                <CardDescription>
                  Configure availability notifications
                </CardDescription>
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
    </div>
  );
}