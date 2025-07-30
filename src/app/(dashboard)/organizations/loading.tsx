import CalendarLoader from '@/components/calendar-loader';

export default function OrganizationsLoading() {
  return <CalendarLoader message="Loading Organizations" submessage="Retrieving your organizations..." />;
}
