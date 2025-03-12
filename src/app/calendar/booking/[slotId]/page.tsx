import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { BookingFormWrapper } from '@/features/calendar/components/booking/booking-form-wrapper';
import { getBookingDetails } from '@/features/calendar/lib/queries';

export default async function BookingPage({ params }: { params: { slotId: string } }) {
  try {
    const { slot, serviceProvider } = await getBookingDetails(params.slotId);

    return (
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Book with {serviceProvider.name}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Fill in your details to request a booking with {serviceProvider.name}
            </p>
          </div>
          <Suspense fallback={<div className="h-[600px] animate-pulse rounded-lg bg-gray-100" />}>
            <div className="rounded-lg bg-white p-6 shadow">
              <BookingFormWrapper initialSlot={slot} initialServiceProvider={serviceProvider} />
            </div>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
