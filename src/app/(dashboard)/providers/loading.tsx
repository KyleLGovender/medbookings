import CalendarLoader from '@/components/calendar-loader';

export default function ServiceProviderLoading() {
  return (
    <CalendarLoader message="Loading Provider" submessage="Preparing provider information..." />
  );
}
