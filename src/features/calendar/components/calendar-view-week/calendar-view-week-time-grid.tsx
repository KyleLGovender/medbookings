'use client';

import { RefObject } from 'react';

import { convertUTCToLocal } from '@/lib/timezone-helper';

import { generateDaysForWeekCalendar, getEventGridPosition } from '../../lib/helper';
import { type AvailabilityView } from '../../lib/types';
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
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewWeekTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  rangeStartDate,
  availabilityData,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewWeekTimeGridProps) {
  // Get the week's dates from the parent component
  const weekDays = generateDaysForWeekCalendar(new Date(rangeStartDate));
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[weekDays.length - 1].date;

  // Set the time bounds for the week
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  // Filter availabilities for current week
  const weekAvailabilities = availabilityData.filter((availability) => {
    const availabilityStart = new Date(availability.startTime);
    return availabilityStart >= weekStart && availabilityStart <= weekEnd;
  });

  return (
    <>
      <div className="flex flex-auto">
        <div className="sticky left-0 z-30 w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time column with horizontal lines */}
          <div className="-z-10 col-start-1 col-end-2 row-start-1">
            <CalendarViewTimeColumn offsetRef={offsetRef} />
          </div>

          {/* Vertical lines for days */}
          <div className="-z-20 col-start-1 col-end-2 row-start-1 grid grid-cols-7 grid-rows-1 divide-x divide-gray-100">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`col-start-${i + 1} row-span-full`} />
            ))}
          </div>

          {/* Availability blocks */}
          <ol
            className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-7"
            style={{
              gridTemplateRows: 'repeat(1440, minmax(0, 1fr))', // 24 hours * 60 minutes
              height: '100%',
            }}
          >
            {weekAvailabilities.map((availability) => {
              const localStartTime = convertUTCToLocal(availability.startTime);
              const localEndTime = convertUTCToLocal(availability.endTime);

              const gridPosition = getEventGridPosition(localStartTime, localEndTime);
              const dayColumn = localStartTime.getDay() === 0 ? 7 : localStartTime.getDay();

              return (
                <CalendarViewAvailability
                  key={availability.id}
                  availability={{
                    ...availability,
                    startTime: localStartTime,
                    endTime: localEndTime,
                  }}
                  gridPosition={gridPosition}
                  gridColumn={dayColumn}
                  serviceProviderId={serviceProviderId}
                  onRefresh={onRefresh}
                  onView={onView}
                  onEdit={onEdit}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );
}
