import CalendarLoader from '@/components/calendar-loader';

export default function NewProviderLoading() {
  return (
    <CalendarLoader
      message="Loading Provider Registration"
      submessage="Preparing registration form..."
      showAfterMs={0}
    />
  );
}