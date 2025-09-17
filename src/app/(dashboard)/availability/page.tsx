'use client';

import { ProviderRequiredMessage } from '@/components/provider-required-message';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';

export default function GlobalAvailabilityPage() {
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
          onCreateAvailability={() => window.location.href = `/availability/create?providerId=${currentProvider.id}&returnUrl=/availability`}
          onEditAvailability={(availability) => window.location.href = `/availability/${availability.id}/edit?returnUrl=/availability`}
        />
      </div>
    </div>
  );
}
