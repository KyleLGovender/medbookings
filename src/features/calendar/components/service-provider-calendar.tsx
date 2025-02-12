import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getCurrentUser } from '@/lib/auth';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

import { getDateRange } from '../lib/helper';
import { getServiceProviderAvailabilityInRange } from '../lib/queries';
import { CalendarWrapper } from './calendar-wrapper';

type SearchParams = { [key: string]: string | string[] | undefined };

export async function ServiceProviderCalendar({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user?.id) redirect('/auth/login');

  const { serviceProviderId } = await getAuthenticatedServiceProvider();
  if (!serviceProviderId) redirect('/profile/service-provider');

  const isValidView = (v: string | undefined): v is 'day' | 'schedule' | 'week' => {
    return v === 'day' || v === 'schedule' || v === 'week';
  };

  const view = searchParams.view as string;
  const validView = isValidView(view) ? view : 'schedule';

  const start = searchParams.start as string;
  let startDate: Date;
  let endDate: Date;

  if (start) {
    startDate = new Date(start);
  } else {
    startDate = new Date();
  }

  const dateRange = getDateRange(startDate, validView);
  startDate = dateRange.from!;
  endDate = dateRange.to!;

  const availability = await getServiceProviderAvailabilityInRange(
    serviceProviderId,
    startDate,
    endDate
  );

  return (
    <Suspense fallback={<div className="h-[600px] animate-pulse rounded-lg bg-gray-100" />}>
      <div className="rounded-lg bg-white shadow">
        <CalendarWrapper
          initialAvailability={availability}
          serviceProviderId={serviceProviderId}
          initialDateRange={{
            from: startDate,
            to: endDate,
          }}
          initialView={validView}
        />
      </div>
    </Suspense>
  );
}
