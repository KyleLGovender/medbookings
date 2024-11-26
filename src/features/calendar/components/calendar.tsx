import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { addDays } from 'date-fns';

import { CalendarWrapper } from '@/features/calendar/components/calendar-wrapper';
import { getServiceProviderScheduleInRange } from '@/features/calendar/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

type SearchParams = { [key: string]: string | string[] | undefined };

export async function Calendar({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  const { serviceProviderId } = await getAuthenticatedServiceProvider();

  if (!serviceProviderId) {
    redirect('/profile/service-provider');
  }

  // Get date range or single date from URL
  const start = searchParams.start as string;
  const end = searchParams.end as string;
  const date = searchParams.date as string;
  const view = searchParams.view as string;

  // Determine dates based on URL parameters
  let startDate: Date;
  let endDate: Date;

  if (date) {
    // If single date is provided, use it for both start and end
    startDate = new Date(date);
    endDate = new Date(date);
  } else {
    // Otherwise use range or defaults
    startDate = start ? new Date(start) : new Date();
    endDate = end ? new Date(end) : addDays(new Date(), 7);
  }

  // Fetch initial data based on URL params or default range
  const initialScheduleData = await getServiceProviderScheduleInRange(
    serviceProviderId,
    startDate,
    endDate
  );

  console.log('Calendar - Initial render:', {
    urlParams: { start, end, date, view },
    startDate,
    endDate,
    initialDataCount: initialScheduleData.length,
  });

  const isValidView = (v: string | undefined): v is 'day' | 'schedule' | 'week' => {
    return v === 'day' || v === 'schedule' || v === 'week';
  };

  const validView = isValidView(view) ? view : undefined;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule
          </p>
        </div>

        <Suspense fallback={<div className="h-[600px] animate-pulse rounded-lg bg-gray-100" />}>
          <div className="rounded-lg bg-white shadow">
            <CalendarWrapper
              initialData={initialScheduleData}
              serviceProviderId={serviceProviderId}
              initialDateRange={{
                from: startDate,
                to: endDate,
              }}
              initialView={validView}
              initialDate={date ? new Date(date) : undefined}
            />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
