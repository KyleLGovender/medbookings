import { Separator } from '@radix-ui/react-dropdown-menu';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BasicInformationCardSkeleton() {
  return (
    <>
      {/* Basic Information Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="mb-4 h-4 w-64" />
          <Separator className="my-4" />

          <div className="space-y-6">
            <div className="flex justify-start">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div>
              <Skeleton className="mb-2 h-5 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>

            <div>
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>

            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
