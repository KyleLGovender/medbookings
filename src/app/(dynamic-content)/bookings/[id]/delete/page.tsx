import { DeleteBookingConfirmation } from '@/features/bookings/components/delete/delete-booking-confirmation';

interface DeleteBookingPageProps {
  params: {
    bookingId: string;
  };
  searchParams: {
    returnUrl?: string;
  };
}

export default function DeleteBookingPage({ params, searchParams }: DeleteBookingPageProps) {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <DeleteBookingConfirmation bookingId={params.bookingId} returnUrl={searchParams.returnUrl} />
    </div>
  );
}
