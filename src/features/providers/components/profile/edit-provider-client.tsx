'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import CalendarLoader from '@/components/calendar-loader';
import { Card, CardContent } from '@/components/ui/card';
import { EditBasicInfo } from '@/features/providers/components/profile/edit-basic-info';
import { EditServices } from '@/features/providers/components/profile/edit-services';
import { SerializedServiceProvider } from '@/features/providers/types/types';

interface EditProviderClientProps {
  providerId: string;
  userId: string;
}

export function EditProviderClient({ providerId, userId }: EditProviderClientProps) {
  const router = useRouter();

  // Fetch service provider data
  const {
    data: provider,
    isLoading: isProviderLoading,
    error: providerError,
  } = useQuery<SerializedServiceProvider>({
    queryKey: ['serviceProvider', providerId],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/404');
          return null;
        }
        throw new Error('Failed to fetch service provider');
      }
      return response.json();
    },
  });

  // Fetch all available services, enabled only after we have the provider data
  const {
    data: services,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['services', provider?.id, provider?.serviceProviderTypeId],
    queryFn: async () => {
      // Build the URL with query parameters
      const url = new URL('/api/providers/services', window.location.origin);

      // Add providerId to check which services are already selected
      url.searchParams.append('providerId', providerId);

      // If we have provider type ID, filter services by provider type
      if (provider?.serviceProviderTypeId) {
        url.searchParams.append('providerTypeId', provider.serviceProviderTypeId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    // Only run this query when we have the provider data
    enabled: !!provider?.id,
  });

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  if (isProviderLoading || isServicesLoading) {
    return (
      <CalendarLoader
        message="Loading Editor"
        submessage="Preparing provider editor..."
        showAfterMs={0}
      />
    );
  }

  if (providerError || servicesError || !provider || !services) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-xl font-semibold text-destructive">Error loading profile</h2>
          <p className="mt-2 text-muted-foreground">
            {providerError instanceof Error
              ? providerError.message
              : servicesError instanceof Error
                ? servicesError.message
                : 'Unable to load profile data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <EditBasicInfo provider={provider} />
      <EditServices provider={provider} availableServices={services} />
    </div>
  );
}
