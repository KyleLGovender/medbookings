import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Calendar header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Days of week header */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={`day-header-${i}`} className="h-6 w-full" />
          ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array(35)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={`day-${i}`} className="aspect-square w-full rounded-md" />
          ))}
      </div>

      {/* Event list skeleton */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={`event-${i}`} className="h-16 w-full rounded-md" />
          ))}
      </div>
    </div>
  );
}
