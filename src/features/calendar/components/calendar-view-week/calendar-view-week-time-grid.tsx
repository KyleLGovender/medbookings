'use client';

import { Fragment, RefObject, useState } from 'react';

import { addDays, startOfWeek } from 'date-fns';

import { getEventGridPosition } from '../../lib/helper';
import { Availability, CalculatedAvailabilitySlot } from '../../lib/types';
import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewEventItem } from '../calendar-view-event-item';
import { CalendarViewTimeColumn } from '../calendar-view-time-column';

interface CalendarViewWeekTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  rangeStartDate: string;
  availabilityData: Availability[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onEventClick?: (slot: CalculatedAvailabilitySlot) => void;
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
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (availability: Availability) => {
    setSelectedAvailability(availability);
    setIsDialogOpen(true);
  };

  // Convert string to Date for calculations
  const dateObj = new Date(rangeStartDate);
  const weekStart = startOfWeek(dateObj);
  const weekEnd = addDays(weekStart, 6);

  // Filter availabilities for the week
  const weekAvailabilities = availabilityData.filter((availability) => {
    const availabilityDate = new Date(availability.startTime);
    return availabilityDate >= weekStart && availabilityDate <= weekEnd;
  });

  const bookings = weekAvailabilities.flatMap((availability) =>
    availability.calculatedSlots
      .filter((slot) => slot.booking)
      .map((slot) => ({
        ...slot.booking!,
        availabilityId: availability.id,
      }))
  );

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

          {/* Availability blocks */}
          <ol
            className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{
              gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto',
            }}
          >
            {weekAvailabilities.map((availability) => (
              <li
                key={availability.id}
                className="relative cursor-pointer bg-blue-200 hover:bg-opacity-75"
                style={{
                  gridRow: getEventGridPosition(availability.startTime, availability.endTime),
                  gridColumn: ((new Date(availability.startTime).getDay() + 6) % 7) + 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(availability);
                }}
              >
                {availability.calculatedSlots.map((slot) => (
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
              </li>
            ))}
          </ol>

          {/* Booking events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{
              gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto',
            }}
          >
            {bookings.map((booking) => (
              <CalendarViewEventItem
                key={booking.id}
                schedule={{
                  ...booking,
                  type: 'BOOKING',
                  startTime: booking.startTime.toISOString(),
                  endTime: booking.endTime.toISOString(),
                }}
                gridPosition={getEventGridPosition(booking.startTime, booking.endTime)}
                gridColumn={((new Date(booking.startTime).getDay() + 6) % 7) + 1}
                onEventClick={onEventClick}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Dialog for editing availability */}
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
