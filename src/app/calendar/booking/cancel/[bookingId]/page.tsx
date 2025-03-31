import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancel Booking',
  description: 'Cancel your booking',
};

interface CancelBookingPageProps {
  params: {
    bookingId: string;
  };
}

export default function CancelBookingPage({ params }: CancelBookingPageProps) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Cancel Booking</h1>
      <p>Booking ID: {params.bookingId}</p>
      {/* Add your cancel booking form/UI here */}
    </div>
  );
}
