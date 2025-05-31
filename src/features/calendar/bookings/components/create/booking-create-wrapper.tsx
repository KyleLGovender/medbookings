'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { BookingCreateForm } from '@/features/bookings/components/create/booking-create-form';
import { getSlotDetails } from '@/features/calendar/lib/queries';
import { AvailabilitySlot } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BookingCreateWrapperProps {
  slotId: string;
  returnUrl?: string;
}

export function BookingCreateWrapper({
  slotId,
  returnUrl = '/calendar',
}: BookingCreateWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [serviceProvider, setServiceProvider] = useState<{
    id: string;
    name: string;
    whatsapp?: string | null;
    image?: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getSlotDetails(slotId);
        if (!result) {
          setError('Slot not found');
          return;
        }
        setSlot(result.slot);
        setServiceProvider(result.serviceProvider);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slotId]);

  const handleCancel = () => {
    router.push(returnUrl);
  };

  const handleSuccess = (bookingId: string) => {
    toast({
      title: 'Success',
      description: 'Booking created successfully',
    });

    // Redirect to the appropriate page
    router.push(`/calendar/booking/success?id=${bookingId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
        </div>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => router.push(returnUrl)}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (slot && serviceProvider) {
    return (
      <div className="rounded-lg bg-white shadow">
        <BookingCreateForm
          slot={slot}
          serviceProvider={serviceProvider}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <h3 className="text-lg font-medium">Missing Data</h3>
          <p>Required information is missing</p>
        </div>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => router.push(returnUrl)}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
