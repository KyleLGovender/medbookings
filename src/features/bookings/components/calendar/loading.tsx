import { CalendarSkeleton } from '@/features/bookings/components/calendar/calendar-skeleton';

export default function CalendarLoading() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-gray-200" />
        </div>

        <div className="rounded-lg bg-gray-50 p-4 shadow">
          {/* Header skeleton */}
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
            <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
              <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>

          {/* Calendar body skeleton */}
          <CalendarSkeleton />
        </div>
      </div>
    </div>
  );
}
