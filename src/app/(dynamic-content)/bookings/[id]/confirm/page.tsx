import { ConfirmBookingForm } from '@/features/bookings/components/confirm/confirm-booking-form';
import { BookingView } from '@/features/bookings/components/view/booking-view';
import { getBookingDetails } from '@/features/calendar/lib/queries';

interface ConfirmBookingPageProps {
  params: {
    bookingId: string;
  };
}

export default async function ConfirmBookingPage({ params }: ConfirmBookingPageProps) {
  const { booking } = await getBookingDetails(params.bookingId);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <ConfirmBookingForm bookingId={params.bookingId} />
          <BookingView bookingId={params.bookingId} />
        </div>
      </div>
    </div>
  );
}
