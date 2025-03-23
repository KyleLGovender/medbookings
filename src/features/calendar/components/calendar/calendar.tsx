import { Suspense } from 'react';

import { CalendarSkeleton } from '@/features/calendar/components/calendar/calendar-skeleton';
import { CalendarWrapper } from '@/features/calendar/components/calendar/calendar-wrapper';

import { getDateRange } from '../../lib/helper';
import { getServiceProviderAvailabilityInRange } from '../../lib/queries';
import { CalendarViewType } from '../../lib/types';

type SearchParams = { [key: string]: string | string[] | undefined };

interface CalendarProps {
  searchParams: SearchParams;
  serviceProviderId: string;
}

export async function Calendar({ searchParams, serviceProviderId }: CalendarProps) {
  const isValidView = (v: string | undefined): v is CalendarViewType => {
    return v !== undefined && Object.values(CalendarViewType).includes(v as CalendarViewType);
  };

  const view = searchParams.view as string;
  const validView = isValidView(view) ? view : 'slots';

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
    <Suspense fallback={<CalendarSkeleton />}>
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
