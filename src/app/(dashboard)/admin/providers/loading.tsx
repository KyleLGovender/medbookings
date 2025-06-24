import CalendarLoader from '@/components/calendar-loader';

export default function ServiceProvidersLoading() {
  return (
    <CalendarLoader
      message="Loading Providers"
      submessage="Getting providers..."
      showAfterMs={0} // Show immediately with no delay
    />
  );
}
