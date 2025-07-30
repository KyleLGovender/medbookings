import CalendarLoader from '@/components/calendar-loader';

export default function NewOrganizationLoading() {
  return (
    <CalendarLoader
      message="Loading Organization Registration"
      submessage="Preparing registration form..."
      showAfterMs={0}
    />
  );
}
