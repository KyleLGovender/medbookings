import { RefObject, useState } from 'react';

import { getEventGridPosition, isSameDay } from '@/features/calendar/lib/helper';
import { AvailabilityView } from '@/features/calendar/lib/types';

import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewTimeColumn } from '../calendar-view-time-column';

// Server Component
interface CalendarViewDayTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  rangeStartDate: string;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function CalendarViewDayTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  rangeStartDate,
  availabilityData,
  serviceProviderId,
  onRefresh,
}: CalendarViewDayTimeGridProps) {
  const dateObj = new Date(rangeStartDate);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityView | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (availability: AvailabilityView) => {
    setSelectedAvailability(availability);
    setIsDialogOpen(true);
  };

  // Filter availabilities for current day
  const dayAvailabilities = availabilityData.filter((availability) =>
    isSameDay(new Date(availability.startTime), dateObj)
  );

  // Get bookings from the availability slots
  const bookings = dayAvailabilities
    .flatMap((availability) => availability.slots)
    .filter((slot) => slot.status === 'BOOKED' && slot.booking)
    .map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      booking: slot.booking,
    }));

  return (
    <>
      <header className="flex items-center justify-center border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
      </header>

      <div className="flex w-full flex-auto">
        <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time grid */}
          <CalendarViewTimeColumn offsetRef={offsetRef} />

          {/* Availability blocks */}
          <ol
            className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-1"
            style={{
              gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto',
            }}
          >
            {dayAvailabilities.flatMap((availability) =>
              availability.slots.map((slot) => (
                <li
                  key={slot.id}
                  className={`relative cursor-pointer ${
                    slot.status === 'AVAILABLE' ? 'bg-blue-200' : 'bg-gray-200'
                  } hover:bg-opacity-75`}
                  style={{
                    gridRow: getEventGridPosition(slot.startTime, slot.endTime),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(availability);
                  }}
                />
              ))
            )}
          </ol>
        </div>
      </div>

      <AvailabilityDialog
        availability={selectedAvailability || undefined}
        serviceProviderId={serviceProviderId}
        mode="edit"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRefresh={onRefresh}
      />
    </>
  );
}
