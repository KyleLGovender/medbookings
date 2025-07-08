'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AvailabilityCreationForm } from '@/features/calendar/availability/components/availability-creation-form';
import { ProviderCalendarView } from '@/features/calendar/availability/components/provider-calendar-view';

interface ProviderAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function ProviderAvailabilityPage({ params }: ProviderAvailabilityPageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateAvailability = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // The calendar will automatically refresh due to the mutation
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  return (
    <>
      <ProviderCalendarView
        providerId={params.id}
        onCreateAvailability={handleCreateAvailability}
      />

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Availability</DialogTitle>
          </DialogHeader>
          <AvailabilityCreationForm
            serviceProviderId={params.id}
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
