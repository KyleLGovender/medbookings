import { AvailabilityView } from '../../lib/types';
import { CalendarViewDayGrid } from './calendar-view-day-grid';

interface CalendarViewDayProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => void;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewDay({
  rangeStartDate,
  availabilityData = [],
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewDayProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };

  return (
    <CalendarViewDayGrid
      rangeStartDate={rangeStartDate.toISOString()}
      onDateChange={(dateStr: string) => onDateChange(new Date(dateStr))}
      availabilityData={availabilityData}
      onViewChange={onViewChange}
      serviceProviderId={serviceProviderId}
      onRefresh={handleRefresh}
      onView={onView}
      onEdit={onEdit}
    />
  );
}
