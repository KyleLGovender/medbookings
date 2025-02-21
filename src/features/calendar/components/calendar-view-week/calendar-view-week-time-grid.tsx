'use client';

import { Fragment, RefObject, useState } from 'react';

import { addDays, startOfWeek } from 'date-fns';

import { getEventGridPosition } from '../../lib/helper';
import { AvailabilitySlot, type AvailabilityView } from '../../lib/types';
import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewEventItem } from '../calendar-view-event-item';
import { CalendarViewTimeColumn } from '../calendar-view-time-column';

interface CalendarViewWeekTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  rangeStartDate: string;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onEventClick?: (slot: AvailabilitySlot) => void;
}

export function CalendarViewWeekTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  rangeStartDate,
  availabilityData,
  serviceProviderId,
  onRefresh,
  onEventClick,
}: CalendarViewWeekTimeGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (slot: AvailabilitySlot) => {
    // Only open dialog if the service provider owns this availability
    const availability = availabilityData.find((a) => a.slots.some((s) => s.id === slot.id));

    if (availability?.serviceProvider.id === serviceProviderId) {
      setSelectedSlot(slot);
      setIsDialogOpen(true);
    } else {
      // Call the regular event click handler if provided
      onEventClick?.(slot);
    }
  };

  // Find the parent availability for the selected slot
  const selectedAvailability = selectedSlot
    ? availabilityData.find((a) => a.slots.some((s) => s.id === selectedSlot.id))
    : undefined;

  // Convert string to Date for calculations
  const dateObj = new Date(rangeStartDate);
  const weekStart = startOfWeek(dateObj);
  const weekEnd = addDays(weekStart, 6);

  // Get all slots for the week from availabilities
  const weekSlots = availabilityData
    .flatMap((availability) => availability.slots)
    .filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= weekStart && slotDate <= weekEnd;
    });

  const bookings = weekSlots
    .filter((slot) => slot.booking)
    .map((slot) => ({
      ...slot.booking!,
      slotId: slot.id,
    }));

  return (
    <>
      <div className="flex flex-auto">
        <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time column with horizontal lines */}
          <CalendarViewTimeColumn offsetRef={offsetRef} />

          {/* Vertical lines */}
          <div className="-z-20 col-start-1 col-end-2 row-start-1 grid grid-cols-7 grid-rows-1 divide-x divide-gray-100">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`col-start-${i + 1} row-span-full`} />
            ))}
          </div>

          {/* Availability slots */}
          <ol
            className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{
              gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto',
            }}
          >
            {weekSlots.map((slot) => (
              <Fragment key={slot.id}>
                <CalendarViewEventItem
                  slot={slot}
                  gridPosition={getEventGridPosition(
                    new Date(slot.startTime),
                    new Date(slot.endTime)
                  )}
                  gridColumn={(new Date(slot.startTime).getDay() % 7) + 1}
                  onEventClick={onEventClick}
                />
              </Fragment>
            ))}
          </ol>
        </div>
      </div>

      {/* Only render dialog if the selected slot belongs to this service provider */}
      {selectedSlot && selectedAvailability?.serviceProvider.id === serviceProviderId && (
        <AvailabilityDialog
          availability={selectedAvailability}
          serviceProviderId={serviceProviderId}
          mode="edit"
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
