'use client';

import { useState } from 'react';

import { AvailabilityDialog } from './availability-dialog';

interface AddAvailabilityButtonProps {
  serviceProviderId: string;
}

export function AddAvailabilityButton({ serviceProviderId }: AddAvailabilityButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <AvailabilityDialog
        mode="create"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        serviceProviderId={serviceProviderId}
      />
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="mx-auto w-full max-w-sm rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:ml-2 md:w-auto"
      >
        Add availability
      </button>
    </>
  );
}
