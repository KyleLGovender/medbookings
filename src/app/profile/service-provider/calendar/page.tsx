import { Calendar } from '@/features/calendar/components/calendar';

export default function CalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <Calendar searchParams={searchParams} />;
}
