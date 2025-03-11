import { notFound } from 'next/navigation';

import { Calendar } from '@/features/calendar/components/calendar';
import { getServiceProviderName } from '@/lib/queries';

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: { serviceProviderId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const name = await getServiceProviderName(params.serviceProviderId);

  if (!name) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book with {name}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Select an available time slot to schedule your appointment with {name}
          </p>
        </div>

        <Calendar searchParams={searchParams} serviceProviderId={params.serviceProviderId} />
      </div>
    </main>
  );
}
