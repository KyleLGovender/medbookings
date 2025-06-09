import { Separator } from '@radix-ui/react-dropdown-menu';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProviderTypeCardSkeleton() {
  return (
    <>
      {/* Provider Type Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="mb-4 h-4 w-64" />
          <Separator className="my-4" />
          <div className="mb-4">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-10 w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
