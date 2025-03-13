import { AvailabilitySlot, AvailabilityView, CalendarViewType, TimeRange } from '../../lib/types';
import { CalendarViewSlotsGrid } from './calendar-view-slots-grid';

interface CalendarViewSlotsProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date, fromView: CalendarViewType) => void;
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

  // Create an adapter function to handle the type mismatch
  const handleViewSlot = (slot: AvailabilitySlot) => {
    // Find the parent availability that contains this slot
    const parentAvailability = availabilityData.find((availability) =>
      availability.slots.some((s) => s.id === slot.id)
    );

    if (parentAvailability) {
      onView(parentAvailability);
    }
  };

  // Create an adapter function to handle the view type mismatch
  const handleViewChange = onViewChange ? () => onViewChange('slots') : undefined;

  return (
    <CalendarViewSlotsGrid
      rangeStartDate={rangeStartDate}
      availabilityData={availabilityData}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
      onView={handleViewSlot}
      onEdit={onEdit}
      selectedServiceId={selectedServiceId}
      timeRange={timeRange}
      onDateChange={(date, fromView) => onDateChange(date, fromView)}
      onViewChange={handleViewChange as any} // Type assertion to bypass the type check
    />
  );
}
