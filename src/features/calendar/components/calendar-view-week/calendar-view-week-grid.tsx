'use client';

import { useEffect, useRef } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import classNames from '@/lib/class-names';
import { convertUTCToLocal } from '@/lib/timezone-helper';

import { getEventGridPosition, isSameDay } from '../../lib/helper';
import { AvailabilityView, ServiceProviderCalendarViewType, TimeRange } from '../../lib/types';
import { CalendarItemAvailability } from '../calendar-utils';
import { CalendarViewTimeColumn } from '../calendar-utils/calendar-view-time-column';

interface CalendarViewWeekGridProps {
  rangeStartDate: Date;
  availabilityData: AvailabilityView[];
  onDateChange: (date: Date, fromView: ServiceProviderCalendarViewType) => void;
  onViewChange?: (view: 'day') => void;
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
  timeRange: TimeRange;
}

export function CalendarViewWeekGrid({
  rangeStartDate,
  availabilityData,
  onDateChange,
  onViewChange = () => {},
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
  timeRange,
}: CalendarViewWeekGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(rangeStartDate);
    date.setDate(rangeStartDate.getDate() + i);
    return date;
  });

  // Keep scroll to current time effect
  useEffect(() => {
    if (!container.current || !containerNav.current || !containerOffset.current) return;
    const currentMinute = new Date().getHours() * 60;
    container.current.scrollTop =
      ((container.current.scrollHeight -
        containerNav.current.offsetHeight -
        containerOffset.current.offsetHeight) *
        currentMinute) /
      1440;
  }, []);

  const startHour = Math.floor(timeRange.earliestTime);
  const endHour = Math.ceil(timeRange.latestTime);
  const hoursToDisplay = endHour - startHour;

  return (
    <div className="flex h-full flex-col">
      <div className="isolate flex flex-auto overflow-hidden bg-white">
        <div ref={container} className="flex flex-auto flex-col overflow-auto">
          {/* Responsive week nav */}
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex bg-white text-gray-500 shadow ring-1 ring-black/5"
          >
            {/* Time column spacer */}
            <div className="w-14 flex-none" />

            {/* Week days */}
            <div className="grid flex-auto grid-cols-7">
              {weekDates.map((date) => (
                <DropdownMenu key={date.toISOString()}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={classNames(
                        'flex w-full flex-col items-center py-3',
                        isSameDay(date, rangeStartDate) && 'font-semibold text-gray-900'
                      )}
                    >
                      <span className="text-xs md:text-sm">
                        <span className="md:hidden">
                          {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                        </span>
                        <span className="hidden md:inline">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </span>
                      <span
                        className={classNames(
                          'mt-1 flex size-8 items-center justify-center rounded-full md:mt-3',
                          isSameDay(date, new Date()) && 'bg-gray-900 font-semibold text-white',
                          !isSameDay(date, new Date()) && 'text-gray-900'
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem
                      onClick={() => {
                        onDateChange(date, 'day');
                      }}
                    >
                      View Day
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </div>

          <div className="flex w-full">
            <div className="sticky left-0 z-30 w-14 flex-none bg-white ring-1 ring-gray-100">
              <CalendarViewTimeColumn offsetRef={containerOffset} timeRange={timeRange} />
            </div>

            <div className="grid flex-auto grid-cols-7">
              {/* Horizontal lines for time slots */}
              <div className="col-start-1 col-end-8 row-start-1 grid">
                <div className="grid divide-y divide-gray-100">
                  {Array.from({ length: hoursToDisplay * 2 }).map((_, i) => (
                    <div key={i} className="h-[1.5rem]" />
                  ))}
                </div>
              </div>

              {/* Vertical lines for days */}
              <div className="col-start-1 col-end-8 row-start-1 grid grid-cols-7 divide-x divide-gray-100">
                {weekDates.map((date) => (
                  <div key={date.toISOString()} className="row-end-1" />
                ))}
              </div>

              {/* Events */}
              <ol
                className="col-start-1 col-end-8 row-start-1 grid grid-cols-7"
                style={{
                  gridTemplateRows: `repeat(${hoursToDisplay * 2}, minmax(1.5rem, 1fr))`,
                }}
              >
                {availabilityData.map((availability) => {
                  const localStartTime = convertUTCToLocal(availability.startTime);
                  const localEndTime = convertUTCToLocal(availability.endTime);
                  const startDate = new Date(localStartTime);
                  const dayIndex = weekDates.findIndex((date) => isSameDay(date, startDate));

                  if (dayIndex === -1) return null;

                  const gridPosition = getEventGridPosition(
                    localStartTime,
                    localEndTime,
                    timeRange
                  );

                  return (
                    <CalendarItemAvailability
                      key={availability.id}
                      availability={{
                        ...availability,
                        startTime: localStartTime,
                        endTime: localEndTime,
                      }}
                      gridPosition={gridPosition}
                      gridColumn={dayIndex + 1}
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
        </div>
      </div>
    </div>
  );
}
