import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ProviderOnboardingForm } from '@/features/providers/components/onboarding/provider-onboarding-form';

export default function NewProviderPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Provider Registration</h1>
        <p className="mt-2 text-muted-foreground">
          Complete your registration to start offering services on MedBookings
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Provider Setup</CardTitle>
          <CardDescription>
            Complete the following steps to register as a healthcare provider and get started with
            MedBookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Loading provider registration form...</p>
              </div>
            }
          >
            <ProviderOnboardingForm />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}