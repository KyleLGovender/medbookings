'use client';

import { RefObject, useMemo, useState } from 'react';

import { addDays, startOfWeek } from 'date-fns';

import { expandRecurringSchedule, getEventGridPosition } from '../../lib/helper';
import { Schedule } from '../../lib/types';
import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewEventItem } from '../calendar-view-event-item';
import { CalendarViewTimeColumn } from '../calendar-view-time-column';

interface CalendarViewWeekTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  scheduleData?: Schedule[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function CalendarViewWeekTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  scheduleData = [],
  serviceProviderId,
  onRefresh,
}: CalendarViewWeekTimeGridProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  // Filter for current week's data and separate availabilities and bookings
  const { weekSchedule, bookings } = useMemo(() => {
    // Guard against empty scheduleData
    if (!scheduleData.length) {
      return { weekSchedule: [], bookings: [] };
    }

    // Get the earliest schedule date to use as reference
    const firstScheduleDate = new Date(
      Math.min(...scheduleData.map((s) => new Date(s.startTime).getTime()))
    );
    const weekStart = startOfWeek(firstScheduleDate);
    const weekEnd = addDays(weekStart, 6);

    // Expand all schedules for the week
    const expandedSchedules = scheduleData.flatMap((schedule) => {
      if (schedule.isRecurring) {
        const endDate = schedule.recurrenceEndDate
          ? new Date(schedule.recurrenceEndDate)
          : addDays(new Date(), 30); // Default to 30 days from now
        return expandRecurringSchedule(schedule, endDate);
      }
      return [schedule];
    });

    // Filter schedules within the week
    const filteredSchedules = expandedSchedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startTime);
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    });

    // Get bookings from the filtered schedules
    const allBookings = filteredSchedules.flatMap((schedule) =>
      schedule.bookings.map((booking) => ({
        ...booking,
        availabilityId: schedule.id,
      }))
    );

    return {
      weekSchedule: filteredSchedules,
      bookings: allBookings,
    };
  }, [scheduleData]);

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
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
          >
            {weekSchedule.map((schedule) => (
              <li
                key={schedule.id}
                className={`relative cursor-pointer ${
                  schedule.isRecurring ? 'bg-gray-200' : 'bg-blue-200'
                } hover:bg-opacity-75`}
                style={{
                  gridRow: getEventGridPosition(schedule.startTime, schedule.endTime),
                  gridColumn: ((new Date(schedule.startTime).getDay() + 6) % 7) + 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(schedule);
                }}
              />
            ))}
          </ol>

          {/* Booking events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
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
                onEventClick={() => {}} // Bookings are not editable
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Dialog for editing availability */}
      <AvailabilityDialog
        availability={selectedSchedule || undefined}
        serviceProviderId={serviceProviderId}
        mode="edit"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRefresh={onRefresh}
      />
    </>
  );
}
