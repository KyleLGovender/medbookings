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
}

export function CalendarViewWeek({
  rangeStartDate,
  availabilityData = [],
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
}: CalendarViewWeekProps) {
  console.log('CalendarViewWeek Component:', {
    rangeStartDate: rangeStartDate.toISOString(),
    availabilityCount: availabilityData.length,
    availabilityData: availabilityData.map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      serviceProvider: a.serviceProvider,
      slotsCount: a.slots.length,
      servicesCount: a.availableServices.length,
    })),
  });

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
