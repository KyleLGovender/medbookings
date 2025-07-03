import Link from 'next/link';
import { Calendar, Plus, Users, BarChart, Settings, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CalendarOverviewPage() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your availability, bookings, and schedule from one central location
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Availability Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Availability Management
              </CardTitle>
              <CardDescription>
                Set your available time slots, manage recurring schedules, and configure booking rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Features:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Create and edit availability slots</li>
                  <li>• Set up recurring patterns</li>
                  <li>• Configure scheduling rules</li>
                  <li>• Visual calendar interface</li>
                  <li>• Drag-and-drop management</li>
                </ul>
              </div>
              <Link href="/calendar/availability">
                <Button className="w-full">
                  Manage Availability
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common calendar tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Availability
                </Button>
              </Link>
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
              </Link>
              <Link href="/calendar/availability">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart className="h-4 w-4 mr-2" />
                  Export Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings & Configuration */}
          <Card className="hover:shadow-lg transition-shadow">
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
                <ul className="text-xs text-gray-500 space-y-1">
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
              <CardDescription>
                Your current calendar status and upcoming schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-500">Available Slots Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                  <div className="text-sm text-gray-500">Booked Appointments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">0</div>
                  <div className="text-sm text-gray-500">Pending Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">0%</div>
                  <div className="text-sm text-gray-500">Calendar Utilization</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
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