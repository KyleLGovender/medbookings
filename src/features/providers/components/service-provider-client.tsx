'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified service provider client component
export function ServiceProviderProfileClient({ userId }: { userId: string }) {
  const { data: serviceProvider, isLoading } = useQuery({
    queryKey: ['serviceProvider', userId],
    queryFn: async () => {
      const response = await fetch(`/api/providers/user/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch service provider');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-lg border-border bg-card dark:border-border dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-foreground dark:text-foreground">
            Service Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!serviceProvider) {
    return (
      <Card className="mx-auto max-w-lg border-border bg-card dark:border-border dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-foreground dark:text-foreground">
            Service Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-center">
          <p className="mb-4 text-muted-foreground dark:text-muted-foreground">
            Register as a service provider to offer your services on our platform.
          </p>
          <Link
            href="/service-provider/new"
            className={buttonVariants({ className: 'mt-2 w-full' })}
          >
            Register as a Service Provider
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg border-border bg-card dark:border-border dark:bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-foreground dark:text-foreground">
          Service Provider Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground dark:text-foreground">
              {serviceProvider.name}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {serviceProvider.serviceProviderType.name}
            </p>
          </div>
          {serviceProvider.bio && (
            <p className="text-sm text-foreground dark:text-foreground">{serviceProvider.bio}</p>
          )}
          <div className="flex justify-end">
            <Link
              href="/profile/service-provider/edit"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Edit Provider Profile
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
