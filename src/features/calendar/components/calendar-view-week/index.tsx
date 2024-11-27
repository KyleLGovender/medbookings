'use client';

import { Schedule } from '../../lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  currentDate: Date;
  scheduleData: Schedule[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
}

export function CalendarViewWeek({
  currentDate,
  scheduleData = [],
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
}: CalendarViewWeekProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };

  return (
    <CalendarViewWeekGrid
      currentDate={currentDate}
      scheduleData={scheduleData}
      onDateChange={onDateChange}
      onViewChange={onViewChange}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
    />
  );
}
