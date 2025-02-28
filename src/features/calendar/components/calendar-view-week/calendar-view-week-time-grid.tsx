'use client';

import { RefObject, useState } from 'react';

import { addDays, startOfWeek } from 'date-fns';

import { convertUTCToLocal } from '@/lib/timezone-helper';

import { getEventGridPosition } from '../../lib/helper';
import { AvailabilitySlot, type AvailabilityView } from '../../lib/types';
import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewAvailability } from '../calendar-view-availability';
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
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityView | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleAvailabilityClick = (availability: AvailabilityView) => {
    if (availability.serviceProvider.id === serviceProviderId) {
      setIsTooltipVisible(true);
    }
  };

  const handleAvailabilityEdit = (availability: AvailabilityView) => {
    if (availability.serviceProvider.id === serviceProviderId) {
      setSelectedAvailability(availability);
      setIsDialogOpen(true);
    }
  };

  // Find the parent availability for the selected slot
  const selectedAvailabilityParent = selectedAvailability
    ? availabilityData.find((a) => a.slots.some((s) => s.id === selectedAvailability.slots[0].id))
    : undefined;

  // Convert UTC dates to local timezone for display
  const localDate = convertUTCToLocal(rangeStartDate);
  const weekStart = startOfWeek(localDate);
  const weekEnd = addDays(weekStart, 6);

  // Filter slots based on local timezone bounds
  const weekSlots = availabilityData
    .flatMap((availability) => availability.slots)
    .filter((slot) => {
      const localSlotTime = convertUTCToLocal(slot.startTime);
      return localSlotTime >= weekStart && localSlotTime <= weekEnd;
    });

  // Example slot grid position calculation
  if (weekSlots.length > 0) {
    const exampleSlot = weekSlots[0];
    const gridPos = getEventGridPosition(
      new Date(exampleSlot.startTime),
      new Date(exampleSlot.endTime)
    );
  }

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
          <ol className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-7">
            {availabilityData.map((availability) => (
              <CalendarViewAvailability
                key={availability.id}
                availability={availability}
                gridPosition={getEventGridPosition(
                  new Date(availability.startTime),
                  new Date(availability.endTime)
                )}
                gridColumn={(new Date(availability.startTime).getDay() % 7) + 1}
                onAvailabilityClick={handleAvailabilityClick}
                onAvailabilityEdit={handleAvailabilityEdit}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Dialog for editing */}
      {selectedAvailability && (
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
