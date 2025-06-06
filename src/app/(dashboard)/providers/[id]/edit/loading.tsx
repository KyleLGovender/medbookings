import CalendarLoader from '@/components/calendar-loader';

export default function EditProviderLoading() {
  return (
    <CalendarLoader
      message="Loading Editor"
      submessage="Preparing provider editor..."
      showAfterMs={0}
    />
  );
}
