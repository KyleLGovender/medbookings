import { OrganizationCalendarView } from '@/features/calendar/availability/components';

interface OrganizationAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function OrganizationAvailabilityPage({
  params,
}: OrganizationAvailabilityPageProps) {
  return <OrganizationCalendarView organizationId={params.id} mode="availability" />;
}
