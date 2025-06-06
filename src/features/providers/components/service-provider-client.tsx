'use client';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import QueryLoader from '@/components/query-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simplified service provider client component
export function ServiceProviderProfileClient({ userId }: { userId: string }) {
  const router = useRouter();
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

  return (
    <QueryLoader
      isLoading={isLoading}
      message="Loading Provider Profile"
      submessage="Retrieving your provider information..."
    >
      {!serviceProvider ? (
        <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-foreground dark:text-foreground">
              Service Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-center">
            <p className="mb-4 text-muted-foreground dark:text-muted-foreground">
              Register as a service provider to offer your services on our platform.
            </p>
            <Button variant="outline" onClick={() => router.push('/service-provider/new')}>
              Register as a Service Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
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
                <p className="text-sm text-foreground dark:text-foreground">
                  {serviceProvider.bio}
                </p>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="default"
                  onClick={() => router.push(`/service-provider/${serviceProvider.id}`)}
                >
                  View Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/service-provider/${serviceProvider.id}/edit`)}
                >
                  Edit Provider Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </QueryLoader>
  );
}
