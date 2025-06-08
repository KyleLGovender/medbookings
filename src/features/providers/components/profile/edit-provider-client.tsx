'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EditBasicInfo } from '@/features/providers/components/profile/edit-basic-info';
import { EditServices } from '@/features/providers/components/profile/edit-services';
import { useProvider } from '@/features/providers/hooks/use-provider';

interface EditProviderClientProps {
  providerId: string;
  userId: string;
}

export function EditProviderClient({ providerId, userId }: EditProviderClientProps) {
  const { provider, isLoading } = useProvider(providerId);

  if (isLoading) {
    return (
      <div className="space-y-8">
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

        {/* Services Card Skeleton */}
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <EditBasicInfo providerId={providerId} userId={userId} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <EditServices providerId={providerId} userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
