'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvailabilityEditForm } from '@/features/calendar/components/availability/availability-edit-form';
import { ArrowLeft, Calendar } from 'lucide-react';

interface EditAvailabilityPageProps {
  params: {
    id: string;
  };
}

function EditAvailabilityPageContent({ params }: EditAvailabilityPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get scope from URL search params (single, future, all)
  const scope = searchParams.get('scope') as 'single' | 'future' | 'all' | null;

  // Get return URL from search params, fallback to calendar
  const returnUrl = searchParams.get('returnUrl') || '/calendar';

  const handleSuccess = () => {
    // Navigate back to where user came from
    router.push(returnUrl);
  };

  const handleCancel = () => {
    // Navigate back to where user came from  
    router.push(returnUrl);
  };

  if (!params.id) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="py-8 text-center">
          <p className="font-medium text-destructive">Invalid availability ID</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unable to edit availability without a valid ID.
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
            <h1 className="text-2xl font-bold">Edit Availability</h1>
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">
          Update your availability settings and configuration.
          {scope && scope !== 'single' && (
            <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {scope === 'future' ? 'Updating this and future occurrences' : 'Updating all occurrences'}
            </span>
          )}
        </p>
      </div>

      {/* Form */}
      <AvailabilityEditForm
        availabilityId={params.id}
        scope={scope || 'single'}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default function EditAvailabilityPage({ params }: EditAvailabilityPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditAvailabilityPageContent params={params} />
    </Suspense>
  );
}