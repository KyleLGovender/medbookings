import { DeclineBookingForm } from '@/features/calendar/components/booking/decline/decline-booking-form';
import { BookingView } from '@/features/calendar/components/booking/view/booking-view';
import { getBookingDetails } from '@/features/calendar/lib/queries';

interface DeclineBookingPageProps {
  params: {
    bookingId: string;
  };
}

export default async function DeclineBookingPage({ params }: DeclineBookingPageProps) {
  const { booking } = await getBookingDetails(params.bookingId);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <DeclineBookingForm bookingId={params.bookingId} />
          <BookingView bookingId={params.bookingId} />
        </div>
      </div>
    </div>
  );
}
