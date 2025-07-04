import { ProviderCalendarView } from '@/features/calendar/availability/components';

interface ProviderAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function ProviderAvailabilityPage({ params }: ProviderAvailabilityPageProps) {
  return <ProviderCalendarView providerId={params.id} mode="availability" />;
}
