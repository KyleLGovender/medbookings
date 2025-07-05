import { ProviderCalendarView } from '@/features/calendar/availability/components/provider-calendar-view';

interface ProviderCalendarPageProps {
  params: {
    id: string;
  };
}

export default function ProviderCalendarPage({ params }: ProviderCalendarPageProps) {
  return <ProviderCalendarView providerId={params.id} />;
}
