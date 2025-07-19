import Link from 'next/link';

import { BarChart, Calendar, Clock, Plus, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';

export default function CalendarOverviewPage() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Unified view of your availability, bookings, and schedule across all contexts
          </p>
        </div>

        {/* Unified Calendar View */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Calendar
              </CardTitle>
              <CardDescription>
                View and manage your schedule across all providers and organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderCalendarView providerId="current" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Availability Management */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Availability Management
              </CardTitle>
              <CardDescription>
                Set your available time slots, manage recurring schedules, and configure booking
                rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Features:</p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Create and edit availability slots</li>
                  <li>• Set up recurring patterns</li>
                  <li>• Configure scheduling rules</li>
                  <li>• Visual calendar interface</li>
                  <li>• Drag-and-drop management</li>
                </ul>
              </div>
              <Link href="/calendar/availability">
                <Button className="w-full">Manage Availability</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common calendar tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Availability
                </Button>
              </Link>
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  View Schedule
                </Button>
              </Link>
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart className="mr-2 h-4 w-4" />
                  Export Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings & Configuration */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Calendar Settings
              </CardTitle>
              <CardDescription>
                Configure your calendar preferences and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Available settings:</p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Visual indicators</li>
                  <li>• Working hours</li>
                  <li>• Scheduling rules</li>
                  <li>• Google Calendar sync</li>
                  <li>• Notification preferences</li>
                </ul>
              </div>
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full">
                  Configure Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Overview Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Overview
              </CardTitle>
              <CardDescription>Your current calendar status and upcoming schedule</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">Available Slots Today</div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-500">Booked Appointments</div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-500">Pending Proposals</div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-purple-600">0%</div>
                  <div className="text-sm text-gray-500">Calendar Utilization</div>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <Link href="/calendar/availability">
                  <Button size="lg" className="w-full md:w-auto">
                    Open Full Calendar Interface
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
