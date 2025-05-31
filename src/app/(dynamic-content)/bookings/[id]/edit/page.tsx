import { BookingEditWrapper } from '@/features/bookings/components/edit/booking-edit-wrapper';

interface BookingEditPageProps {
  params: {
    bookingId: string;
  };
  searchParams: {
    returnUrl?: string;
  };
}

export default function BookingEditPage({ params, searchParams }: BookingEditPageProps) {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <BookingEditWrapper bookingId={params.bookingId} returnUrl={searchParams.returnUrl} />
    </div>
  );
}
