'use client';

import { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
        {/* Organization Basic Info Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="mb-4 h-4 w-64" />
            <div className="space-y-4">
              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Skeleton className="mb-2 h-5 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="mb-2 h-5 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Locations Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="mb-4 h-4 w-64" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-md border p-4">
                  <Skeleton className="mb-2 h-6 w-48" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <div className="mt-4 flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
