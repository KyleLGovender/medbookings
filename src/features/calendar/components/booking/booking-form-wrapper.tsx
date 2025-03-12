'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AvailabilitySlot } from '../../lib/types';
import { BookingForm } from '../booking/booking-form';

interface BookingFormWrapperProps {
  initialSlot: AvailabilitySlot;
  initialServiceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export function BookingFormWrapper({
  initialSlot,
  initialServiceProvider,
}: BookingFormWrapperProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // You can add more state management here if needed
  // For example, tracking form completion steps, validation states, etc.

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = (bookingId: string) => {
    // Navigate to success page with the booking ID
    router.push(`/calendar/booking/success?bookingId=${bookingId}`);
    router.refresh();
  };

  return (
    <BookingForm
      slot={initialSlot}
      serviceProvider={initialServiceProvider}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
    />
  );
}
