import { OrganizationCalendarView } from '@/features/calendar/availability/components/organization-calendar-view';

interface OrganizationAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function OrganizationAvailabilityPage({
  params,
}: OrganizationAvailabilityPageProps) {
  return <OrganizationCalendarView organizationId={params.id} />;
}
