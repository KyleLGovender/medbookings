'use client';

import { AvailabilityView } from '../../lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewWeek({
  rangeStartDate,
  availabilityData = [],
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
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
      onView={onView}
      onEdit={onEdit}
    />
  );
}
