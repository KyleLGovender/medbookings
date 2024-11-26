'use client';

import { RefObject, useMemo, useState } from 'react';

import { getEventGridPosition } from '../../lib/helper';
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
  console.log('CalendarViewWeekTimeGrid - Processing scheduleData:', {
    count: scheduleData.length,
    data: scheduleData,
  });

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEventClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  // Filter for current week's data
  const currentWeekSchedule = useMemo(() => {
    const filtered = scheduleData.filter((schedule) => {
      const scheduleDate = new Date(schedule.startTime);
      // Add your week filtering logic here
      return true; // Temporarily return all data to debug
    });

    console.log('CalendarViewWeekTimeGrid - Filtered schedule:', {
      beforeCount: scheduleData.length,
      afterCount: filtered.length,
      filtered,
    });

    return filtered;
  }, [scheduleData]);

  return (
    <>
      <div className="flex flex-auto">
        <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time column */}
          <CalendarViewTimeColumn offsetRef={offsetRef} />

          {/* Vertical lines */}
          <div className="col-start-1 col-end-2 row-start-1 grid grid-cols-7 grid-rows-1 divide-x divide-gray-100">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`col-start-${i + 1} row-span-full`} />
            ))}
          </div>

          {/* Events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
          >
            {Array.isArray(currentWeekSchedule) &&
              currentWeekSchedule.map((schedule) => {
                console.log('Rendering event item:', {
                  id: schedule.id,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                  gridPosition: getEventGridPosition(schedule.startTime, schedule.endTime),
                  gridColumn: new Date(schedule.startTime).getDay() + 1,
                });

                return (
                  <CalendarViewEventItem
                    key={schedule.id}
                    schedule={schedule}
                    gridPosition={getEventGridPosition(schedule.startTime, schedule.endTime)}
                    gridColumn={new Date(schedule.startTime).getDay() + 1}
                    onEventClick={handleEventClick}
                  />
                );
              })}
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
