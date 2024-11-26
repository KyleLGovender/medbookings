import { Schedule } from '../../lib/types';
import { CalendarViewDayGrid } from './calendar-view-day-grid';

interface CalendarViewDayProps {
  currentDate: Date;
  scheduleData: Schedule[];
  onDateChange: (date: Date) => void;
}

export function CalendarViewDay({ currentDate, scheduleData, onDateChange }: CalendarViewDayProps) {
  return (
    <CalendarViewDayGrid
      currentDate={currentDate.toISOString()}
      onDateChange={(dateStr: string) => onDateChange(new Date(dateStr))}
      scheduleData={scheduleData}
    />
  );
}
