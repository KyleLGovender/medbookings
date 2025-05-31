'use client';

import { CalendarViewScheduleGrid } from '@/features/calendar/components/calendar-view-schedule/calendar-view-schedule-grid';

import { AvailabilityView } from '../../../features/calendar/lib/types';

interface CalendarViewScheduleProps {
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => void;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewSchedule({
  availabilityData,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewScheduleProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };

  return (
    <CalendarViewScheduleGrid
      availabilityData={availabilityData}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
      onView={onView}
      onEdit={onEdit}
    />
  );
}
