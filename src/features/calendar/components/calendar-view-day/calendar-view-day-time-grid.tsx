import { RefObject, useState } from 'react';

import { CalendarViewEventItem } from '@/features/calendar/components/calendar-view-event-item';
import {
  expandRecurringSchedule,
  getEventGridPosition,
  isSameDay,
} from '@/features/calendar/lib/helper';
import { Schedule } from '@/features/calendar/lib/types';

import { AvailabilityDialog } from '../availability-dialog';
import { CalendarViewTimeColumn } from '../calendar-view-time-column';

// Server Component
interface CalendarViewDayTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  currentDate: string;
  scheduleData: Schedule[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function CalendarViewDayTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  currentDate,
  scheduleData,
  serviceProviderId,
  onRefresh,
}: CalendarViewDayTimeGridProps) {
  const currentDateObj = new Date(currentDate);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  // Expand recurring schedules and filter for current day
  const daySchedule = scheduleData
    .flatMap((schedule) => {
      // Handle both recurring and single instances
      if (schedule.isRecurring) {
        return expandRecurringSchedule(schedule, currentDateObj);
      }
      return [schedule];
    })
    .filter((schedule) => isSameDay(new Date(schedule.startTime), currentDateObj));

  // Get bookings from the schedule
  const bookings = daySchedule.flatMap((schedule) =>
    schedule.bookings.map((booking) => ({
      ...booking,
      availabilityId: schedule.id,
    }))
  );

  return (
    <>
      <header className="flex items-center justify-center border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {currentDateObj.toLocaleDateString('en-US', {
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
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
          >
            {daySchedule.map((schedule) => (
              <li
                key={schedule.id}
                className={`relative cursor-pointer ${
                  schedule.isRecurring ? 'bg-gray-200' : 'bg-blue-200'
                } hover:bg-opacity-75`}
                style={{
                  gridRow: getEventGridPosition(schedule.startTime, schedule.endTime),
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
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
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
                gridColumn={1}
              />
            ))}
          </ol>
        </div>
      </div>

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
