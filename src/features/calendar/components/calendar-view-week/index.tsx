'use client';

import { AvailabilityView, TimeRange, ViewType } from '../../lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date, fromView: ViewType) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
  timeRange: TimeRange;
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
  timeRange,
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
      timeRange={timeRange}
    />
  );
}
