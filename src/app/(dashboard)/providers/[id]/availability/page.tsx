import { ProviderCalendarView } from '@/features/calendar/availability/components/provider-calendar-view';

interface ProviderAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function ProviderAvailabilityPage({ params }: ProviderAvailabilityPageProps) {
  return <ProviderCalendarView providerId={params.id} />;
}
