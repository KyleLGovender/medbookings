import CalendarLoader from '@/components/calendar-loader';

export default function JoinMedBookingsLoading() {
  return (
    <CalendarLoader
      message="Welcome to MedBookings"
      submessage="Preparing the provider view..."
      showAfterMs={0} // Show immediately
    />
  );
}
