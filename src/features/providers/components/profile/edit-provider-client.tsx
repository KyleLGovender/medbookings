'use client';

import { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { EditBasicInfo } from '@/features/providers/components/profile/edit-basic-info';
import { EditServices } from '@/features/providers/components/profile/edit-services';
import { BasicInformationCardSkeleton } from '@/features/providers/components/skeletons/basic-information-card-skeleton';
import { ProviderTypeCardSkeleton } from '@/features/providers/components/skeletons/provider-type-card-skeleton';
import { ServicesCardSkeleton } from '@/features/providers/components/skeletons/services-card-skeleton';
import { useProvider } from '@/features/providers/hooks/use-provider';

// Import useForm and FormProvider

interface EditProviderClientProps {
  providerId: string;
  userId: string;
}

export function EditProviderClient({ providerId, userId }: EditProviderClientProps) {
  const { provider, isLoading } = useProvider(providerId);
  const methods = useForm({
    defaultValues: provider, // provider can be undefined initially
  }); // Initialize the form

  // Effect to reset the form when provider data changes, ensuring the form's
  // default values are updated to reflect the latest state from the backend.
  // This is crucial for preventing loops where the form might still be considered
  // 'dirty' relative to stale defaultValues after a successful save and data refetch.
  useEffect(() => {
    if (provider) {
      methods.reset(provider);
    }
  }, [provider, methods]); // methods.reset is stable, provider is the dependency

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Provider Type Card Skeleton */}
        <ProviderTypeCardSkeleton />
        <BasicInformationCardSkeleton />
        <ServicesCardSkeleton />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      {/* Pass all methods to FormProvider */}
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

        <Card>
          <CardContent className="p-6">
            {/* <EditRegulatoryRequirements
              providerId={providerId}
              userId={userId}
              providerTypeId={provider?.serviceProviderTypeId || ''}
            /> */}
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
