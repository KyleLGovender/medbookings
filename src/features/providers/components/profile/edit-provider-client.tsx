'use client';

import { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { ProviderProfileSkeleton } from '@/components/skeletons/provider-profile-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EditBasicInfo } from '@/features/providers/components/profile/edit-basic-info';
import { EditRegulatoryRequirements } from '@/features/providers/components/profile/edit-regulatory-requirements';
import { EditServices } from '@/features/providers/components/profile/edit-services';
import { useProvider } from '@/features/providers/hooks/use-provider';

// Import useForm and FormProvider

interface EditProviderClientProps {
  providerId: string;
  userId: string;
}

export function EditProviderClient({ providerId, userId }: EditProviderClientProps) {
  const { data: provider, isLoading } = useProvider(providerId);
  const methods = useForm({
    defaultValues: provider,
  });

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
        <ProviderProfileSkeleton />
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
            <EditRegulatoryRequirements providerId={providerId} userId={userId} />
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
