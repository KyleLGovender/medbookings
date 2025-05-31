'use client';

import {
  AvailabilityView,
  ServiceProviderCalendarViewType,
  TimeRange,
} from '../../../features/calendar/lib/types';
import { CalendarViewWeekGrid } from './calendar-view-week-grid';

interface CalendarViewWeekProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date, fromView: ServiceProviderCalendarViewType) => void;
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

  // Create an adapter function to handle the type mismatch
  const handleDateChange = (date: Date, fromView: any) => {
    onDateChange(date, 'week');
  };

  return (
    <CalendarViewWeekGrid
      rangeStartDate={rangeStartDate}
      availabilityData={availabilityData}
      onDateChange={handleDateChange}
      onViewChange={onViewChange}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
      onView={onView}
      onEdit={onEdit}
      timeRange={timeRange}
    />
  );
}
