import { BookingCreateWrapper } from '@/features/calendar/components/booking/create/booking-create-wrapper';

interface BookingCreatePageProps {
  params: {
    slotId: string;
  };
  searchParams: {
    returnUrl?: string;
  };
}

export default function BookingCreatePage({ params, searchParams }: BookingCreatePageProps) {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book with </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select an available time slot to schedule your appointment with
          </p>
        </div>

        <BookingCreateWrapper slotId={params.slotId} returnUrl={searchParams.returnUrl} />
      </div>
    </div>
  );
}
