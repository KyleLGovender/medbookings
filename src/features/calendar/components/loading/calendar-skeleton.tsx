import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for calendar components
 * Provides consistent loading states across different calendar views
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 sm:h-6 sm:w-48" />
                <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-2 sm:gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
                    <Skeleton className="h-2 w-8 sm:h-3 sm:w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls Skeleton */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9" />
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
              <Skeleton className="hidden h-9 w-20 sm:block" />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Skeleton className="h-8 w-28 flex-shrink-0 sm:h-9 sm:w-40" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Calendar Grid Skeleton */}
          <div className="space-y-2 sm:space-y-4">
            {/* Time labels - responsive grid */}
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
              <div className="space-y-2">
                <Skeleton className="h-3 w-8 sm:h-4 sm:w-16" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center sm:hidden">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-2 w-6" />
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="hidden space-y-2 text-center sm:block">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>

            {/* Calendar rows - responsive */}
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-1 sm:grid-cols-8">
                <div className="flex items-center">
                  <Skeleton className="h-3 w-8 sm:h-4 sm:w-12" />
                </div>
                {Array.from({ length: 3 }).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1 sm:hidden">
                    <Skeleton className="h-12 w-full sm:h-16" />
                  </div>
                ))}
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <div key={colIndex} className="hidden space-y-1 sm:block">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact skeleton for smaller calendar components
 */
export function CalendarSkeletonCompact() {
  return (
    <Card>
      <CardContent className="p-4 pt-6 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 sm:h-6 sm:w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
          </div>

          {/* Responsive grid - 7 columns on desktop, 3 on mobile */}
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-7">
            {/* Mobile: Show only 21 items (3 weeks) */}
            {Array.from({ length: 21 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full sm:hidden" />
            ))}
            {/* Desktop: Show all 42 items (6 weeks) */}
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={`desktop-${i}`} className="hidden h-16 w-full sm:block" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Event list skeleton for sidebar or list views
 */
export function CalendarEventListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-1 rounded-full sm:h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full sm:h-4" />
                <Skeleton className="h-2 w-20 sm:h-3 sm:w-24" />
              </div>
              <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
