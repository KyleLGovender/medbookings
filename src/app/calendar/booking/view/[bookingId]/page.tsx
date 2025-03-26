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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book with </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select an available time slot to schedule your appointment with
          </p>
        </div>

        <BookingView bookingId={params.bookingId} />
      </div>
    </div>
  );
}
