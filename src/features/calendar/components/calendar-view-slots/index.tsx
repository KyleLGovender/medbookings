import { AvailabilityView, TimeRange } from '../../lib/types';
import { CalendarViewSlotsGrid } from './calendar-view-slots-grid';

interface CalendarViewSlotsProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'slots') => void;
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
  selectedServiceId?: string;
  timeRange: TimeRange;
}

export function CalendarViewSlots({
  rangeStartDate,
  availabilityData,
  onDateChange,
  onViewChange,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
  selectedServiceId,
  timeRange,
}: CalendarViewSlotsProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };

  return (
    <CalendarViewSlotsGrid
      rangeStartDate={rangeStartDate}
      availabilityData={availabilityData}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
      onView={onView}
      onEdit={onEdit}
      selectedServiceId={selectedServiceId}
      timeRange={timeRange}
    />
  );
}
