import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { addDays } from 'date-fns';

import { CalendarWrapper } from '@/features/calendar/components/calendar-wrapper';
import { getServiceProviderScheduleInRange } from '@/features/calendar/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

export async function Calendar() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  const { serviceProviderId } = await getAuthenticatedServiceProvider();

  if (!serviceProviderId) {
    redirect('/profile/service-provider');
  }

  const initialData = await getServiceProviderScheduleInRange(
    serviceProviderId,
    new Date(),
    addDays(new Date(), 7)
  );

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
            <CalendarWrapper initialData={initialData} serviceProviderId={serviceProviderId} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
