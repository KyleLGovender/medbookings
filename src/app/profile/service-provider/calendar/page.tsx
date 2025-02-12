import { ServiceProviderCalendar } from '@/features/calendar/components/service-provider-calendar';

export default async function ServiceProviderProfilePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Calendar</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule
          </p>
        </div>

        <ServiceProviderCalendar searchParams={searchParams} />
      </div>
    </main>
  );
}
