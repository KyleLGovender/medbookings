import { Separator } from '@radix-ui/react-dropdown-menu';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ServicesCardSkeleton() {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="mb-4 h-4 w-64" />
          <Separator className="my-4" />

          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-md border p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="mt-4">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
