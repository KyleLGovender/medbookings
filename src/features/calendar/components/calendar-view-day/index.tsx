import { Schedule } from '../../lib/types';
import { CalendarViewDayGrid } from './calendar-view-day-grid';

interface CalendarViewDayProps {
  currentDate: Date;
  scheduleData: Schedule[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
}

export function CalendarViewDay({
  currentDate,
  scheduleData,
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
}: CalendarViewDayProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };
  return (
    <CalendarViewDayGrid
      currentDate={currentDate.toISOString()}
      onDateChange={(dateStr: string) => onDateChange(new Date(dateStr))}
      scheduleData={scheduleData}
      onViewChange={onViewChange}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
    />
  );
}
