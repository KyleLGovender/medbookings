import { AvailabilityView } from '../../lib/types';
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
    />
  );
}
