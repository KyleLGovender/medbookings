'use client';

import { Availability } from '../../lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  rangeStartDate: Date;
  availabilityData: Availability[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
}

export function CalendarViewWeek({
  rangeStartDate,
  availabilityData = [],
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
      rangeStartDate={rangeStartDate}
      availabilityData={availabilityData}
      onDateChange={onDateChange}
      onViewChange={onViewChange}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
    />
  );
}
