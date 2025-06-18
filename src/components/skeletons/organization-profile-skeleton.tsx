import { Separator } from '@radix-ui/react-dropdown-menu';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationProfileSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Organization Details Card Skeleton */}
      <Card className="p-6">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-4 h-4 w-64" />
        <Separator className="my-4" />

        <div className="space-y-6">
          <div className="flex justify-start">
            <Skeleton className="h-32 w-32 rounded-lg" />
          </div>

          <div>
            <Skeleton className="mb-2 h-5 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div>
            <Skeleton className="mb-2 h-5 w-20" />
            <Skeleton className="h-6 w-64" />
          </div>

          <div>
            <Skeleton className="mb-2 h-5 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div>
            <Skeleton className="mb-2 h-5 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Card>

      {/* Locations Card Skeleton */}
      <Card className="p-6">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="mb-4 h-4 w-64" />
        <Separator className="my-4" />

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border p-4">
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="mb-2 h-4 w-full" />
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
