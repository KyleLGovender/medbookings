import { redirect } from 'next/navigation';

import { BookingWrapper } from '@/features/calendar/components/booking-wrapper';
import { getDateRange } from '@/features/calendar/lib/helper';
import { getServiceProviderAvailabilityInRange } from '@/features/calendar/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

type SearchParams = { [key: string]: string | string[] | undefined };

export async function Booking({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  const { serviceProviderId } = await getAuthenticatedServiceProvider();

  if (!serviceProviderId) {
    redirect('/profile/service-provider');
  }

  // Get start and end dates from search params or use defaults
  const start = searchParams.start as string;
  const end = searchParams.end as string;

  let startDate: Date;
  let endDate: Date;

  if (start) {
    startDate = new Date(start);
  } else {
    startDate = new Date();
  }

  // Get date range using the same helper as calendar
  const dateRange = getDateRange(startDate, 'day');
  startDate = dateRange.from!;
  endDate = dateRange.to!;

  // Fetch initial availability data for the date range
  const availability = await getServiceProviderAvailabilityInRange(
    serviceProviderId,
    startDate,
    endDate
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make a Booking</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please fill in the details below to schedule your appointment
          </p>
        </div>

        <div className="rounded-lg bg-white shadow">
          <BookingWrapper
            initialAvailability={availability}
            serviceProviderId={serviceProviderId}
            userId={user.id}
            initialDateRange={{
              from: startDate,
              to: endDate,
            }}
          />
        </div>
      </div>
    </main>
  );
}
