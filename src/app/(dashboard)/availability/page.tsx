import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';

export default async function GlobalAvailabilityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Calendar</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule across all contexts
          </p>
        </div>

        <ProviderCalendarView providerId="current" />
      </div>
    </div>
  );
}
