'use client';

import { Schedule } from '../../lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  currentDate: Date;
  scheduleData: Schedule[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
}

export function CalendarViewWeek({
  currentDate,
  scheduleData = [],
  onDateChange,
  onViewChange = () => {},
}: CalendarViewWeekProps) {
  console.log('CalendarViewWeek - Received scheduleData:', {
    count: scheduleData.length,
    data: scheduleData,
  });

  return (
    <CalendarViewWeekGrid
      currentDate={currentDate}
      scheduleData={scheduleData}
      onDateChange={onDateChange}
      onViewChange={onViewChange}
    />
  );
}
