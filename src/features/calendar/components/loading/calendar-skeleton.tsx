import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for calendar components
 * Provides consistent loading states across different calendar views
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-9 w-9" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid Skeleton */}
          <div className="space-y-4">
            {/* Time labels */}
            <div className="grid grid-cols-8 gap-1">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>

            {/* Calendar rows */}
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-8 gap-1">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-12" />
                </div>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
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
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-1 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}