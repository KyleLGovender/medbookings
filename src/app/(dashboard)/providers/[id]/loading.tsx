import CalendarLoader from '@/components/calendar-loader';

export default function ServiceProviderDetailLoading() {
  return (
    <CalendarLoader
      message="Loading Provider"
      submessage="Getting provider details..."
      showAfterMs={0} // Show immediately with no delay
    />
  );
}
