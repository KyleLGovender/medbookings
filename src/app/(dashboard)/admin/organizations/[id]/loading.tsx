import CalendarLoader from '@/components/calendar-loader';

export default function ServiceOrganizationDetailLoading() {
  return (
    <CalendarLoader
      message="Loading Organization"
      submessage="Getting organization details..."
      showAfterMs={0} // Show immediately with no delay
    />
  );
}
