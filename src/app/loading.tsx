import CalendarLoader from '@/components/calendar-loader';

export default function Loading() {
  return (
    <CalendarLoader
      message="Loading MedBookings"
      submessage="Preparing your healthcare platform..."
      showAfterMs={0}
    />
  );
}
