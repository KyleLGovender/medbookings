'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AvailabilityCreationForm } from '@/features/calendar/components/availability/availability-creation-form';
import { ArrowLeft, Calendar } from 'lucide-react';

function CreateAvailabilityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL search params
  const providerId = searchParams.get('providerId');
  const date = searchParams.get('date');
  const organizationId = searchParams.get('organizationId');
  const locationId = searchParams.get('locationId');
  const returnUrl = searchParams.get('returnUrl') || '/calendar';

  const handleSuccess = () => {
    // Navigate back to where user came from
    router.push(returnUrl);
  };

  const handleCancel = () => {
    // Navigate back to where user came from
    router.push(returnUrl);
  };

  if (!providerId) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="py-8 text-center">
          <p className="font-medium text-destructive">Missing provider information</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unable to create availability without provider details.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/calendar')}
            className="mt-4"
          >
            Return to Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Create Availability</h1>
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">
          Set up your availability for appointments and bookings.
        </p>
      </div>

      {/* Form */}
      <AvailabilityCreationForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default function CreateAvailabilityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAvailabilityPageContent />
    </Suspense>
  );
}
