import CalendarLoader from '@/components/calendar-loader';

export default function DashboardLoading() {
  return (
    <CalendarLoader message="Loading Dashboard" submessage="Preparing your healthcare data..." />
  );
}
