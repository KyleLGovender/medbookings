'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';

export default function GlobalAvailabilityPage() {
  const router = useRouter();
  const { data: currentProvider, isLoading, error } = useCurrentUserProvider();

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
              <div className="animate-pulse">
                <div className="h-64 rounded-lg bg-gray-200"></div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Your Calendar</h1>
            <p className="mt-2 text-sm text-gray-600">
              Provider profile required to manage calendar availability
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-orange-600">
                Provider Profile Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To manage your calendar availability, you need to complete your provider profile
                setup. This includes your professional information, services, and regulatory
                requirements.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push('/profile')}>Complete Provider Setup</Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
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

        <ProviderCalendarView providerId={currentProvider.id} />
      </div>
    </div>
  );
}
