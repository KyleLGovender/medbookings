'use client';

import { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { OrganizationProfileSkeleton } from '@/components/skeletons/organization-profile-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EditOrganizationBasicInfo } from '@/features/organizations/components/profile/edit-organization-basic-info';
import { EditOrganizationLocations } from '@/features/organizations/components/profile/edit-organization-locations';
import { useOrganization } from '@/features/organizations/hooks/use-organization';

interface EditOrganizationProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganization({ organizationId, userId }: EditOrganizationProps) {
  const { data: organization, isLoading } = useOrganization(organizationId);
  const methods = useForm({
    defaultValues: organization, // organization can be undefined initially
  });

  // Effect to reset the form when organization data changes, ensuring the form's
  // default values are updated to reflect the latest state from the backend.
  // This is crucial for preventing loops where the form might still be considered
  // 'dirty' relative to stale defaultValues after a successful save and data refetch.
  useEffect(() => {
    if (organization) {
      methods.reset(organization);
    }
  }, [organization, methods]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <OrganizationProfileSkeleton />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <EditOrganizationBasicInfo organizationId={organizationId} userId={userId} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <EditOrganizationLocations organizationId={organizationId} userId={userId} />
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
