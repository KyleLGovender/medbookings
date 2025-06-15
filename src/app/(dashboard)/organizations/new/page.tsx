import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationRegistrationForm } from '@/features/organizations/components/registration-form';

export default function NewOrganizationPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Organization Registration</h1>
        <p className="mt-2 text-muted-foreground">
          Complete your registration to start offering services on MedBookings
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Setup</CardTitle>
          <CardDescription>
            Complete the following steps to register your organization and get started with
            MedBookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <OrganizationRegistrationForm />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}
