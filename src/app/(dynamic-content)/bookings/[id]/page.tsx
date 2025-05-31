import { BookingView } from '@/features/calendar/components/booking/view/booking-view';

interface BookingCreatePageProps {
  params: {
    bookingId: string;
  };
}

export default function BookingViewPage({ params }: BookingCreatePageProps) {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <BookingView bookingId={params.bookingId} />
      </div>
    </div>
  );
}
