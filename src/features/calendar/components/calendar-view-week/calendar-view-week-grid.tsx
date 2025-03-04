'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { CalendarViewWeekTimeGrid } from '@/features/calendar/components/calendar-view-week/calendar-view-week-time-grid';
import { generateDaysForWeekCalendar } from '@/features/calendar/lib/helper';
import { AvailabilityView } from '@/features/calendar/lib/types';

interface CalendarViewWeekGridProps {
  rangeStartDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void; // Add these props
  onEdit: (availability: AvailabilityView) => void;
}

function formatDateRange(weekDays: { date: Date }[]): string {
  if (!weekDays.length) return '';

  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  return `${startDate.toLocaleDateString('en-US', { weekday: 'short' })} ${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { weekday: 'short' })} ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })}`;
}

export function CalendarViewWeekGrid({
  rangeStartDate,
  onDateChange,
  onViewChange = () => {},
  availabilityData = [],
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewWeekGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    return generateDaysForWeekCalendar(rangeStartDate);
  }, [rangeStartDate]);

  const handleDayClick = useCallback(
    (date: Date) => {
      // Create a new date to avoid mutations and ensure it's in local time
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

      // Format date for URL in YYYY-MM-DD format
      const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

      // Update URL parameters
      const params = new URLSearchParams(window.location.search);
      params.set('start', formattedDate);
      params.set('view', 'day');
      window.history.pushState({}, '', `?${params.toString()}`);

      // Call parent handlers with the local date
      onDateChange(localDate);
      onViewChange('day');
    },
    [onDateChange, onViewChange]
  );

  useEffect(() => {
    if (!container.current || !containerNav.current || !containerOffset.current) return;

    const updateScrollPosition = () => {
      const currentMinute = new Date().getHours() * 60 + new Date().getMinutes();
      container.current!.scrollTop =
        ((container.current!.scrollHeight -
          containerNav.current!.offsetHeight -
          containerOffset.current!.offsetHeight) *
          currentMinute) /
        1440;
    };

    updateScrollPosition();

    const intervalId = setInterval(updateScrollPosition, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <h2 className="flex items-center justify-center border-b px-4 py-2 text-lg font-semibold text-gray-900">
        {formatDateRange(weekDays)}
      </h2>

      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="flex max-w-full flex-none flex-col">
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5"
          >
            <div className="flex">
              <div className="sticky left-0 z-10 w-14 flex-none bg-white" />
              <div className="grid flex-auto grid-cols-7 divide-x divide-gray-100">
                {weekDays.map((day, index) => (
                  <div key={index} className="flex items-center justify-center py-3">
                    <button
                      onClick={() => handleDayClick(day.date)}
                      className="cursor-pointer rounded-lg px-2 py-1 hover:bg-gray-100"
                    >
                      <span>
                        <span className="hidden sm:inline">
                          {day.date.toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}{' '}
                        </span>
                        <span className="items-center justify-center font-semibold text-gray-900">
                          {day.date.getDate()}
                        </span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <CalendarViewWeekTimeGrid
            containerRef={container}
            navRef={containerNav}
            offsetRef={containerOffset}
            rangeStartDate={rangeStartDate.toISOString()}
            availabilityData={availabilityData}
            serviceProviderId={serviceProviderId}
            onRefresh={onRefresh}
            onView={onView}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
}
