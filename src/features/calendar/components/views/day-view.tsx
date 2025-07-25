import { Repeat } from 'lucide-react';

import { AvailabilityStatus, CalendarEvent } from '@/features/calendar/types/types';
import { getEventsForDay, getWorkingTimeRange, calculateEventPosition } from '@/features/calendar/lib/calendar-utils';

import { DayViewProps } from './types';

// Day View Component
export function DayView({
  currentDate,
  events,
  workingHours,
  onEventClick,
  onTimeSlotClick,
  onDateClick,
  getEventStyle,
}: DayViewProps) {
  const dayEvents = getEventsForDay(events, currentDate);

  // Calculate display time range based on events
  const getDisplayTimeRange = () => {
    const defaultStart = 6; // 6 AM
    const defaultEnd = 18; // 6 PM

    let earliestHour = defaultStart;
    let latestHour = defaultEnd;

    // Check all events to extend range if needed
    dayEvents.forEach((event) => {
      const startHour = new Date(event.startTime).getHours();
      const endHour = new Date(event.endTime).getHours();

      if (startHour < earliestHour) earliestHour = startHour;
      if (endHour > latestHour) latestHour = endHour;
    });

    return { start: earliestHour, end: latestHour };
  };

  const timeRange = getDisplayTimeRange();
  const hours = Array.from(
    { length: timeRange.end - timeRange.start },
    (_, i) => timeRange.start + i
  );

  const calculateEventPositionForDay = (event: CalendarEvent) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    // Convert to hour-based grid slots, accounting for display range offset
    // The events grid has hours.length * 2 rows, so we need to multiply by 2
    const startHour = startTime.getHours() - timeRange.start;
    const endHour = endTime.getHours() - timeRange.start;
    const startSlot = Math.max(1, startHour * 2 + 1);
    const endSlot = Math.max(startSlot + 1, endHour * 2 + 1);
    const spanSlots = endSlot - startSlot;

    return { gridRow: `${startSlot} / span ${spanSlots}` };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="flex max-w-full flex-none flex-col">
          <div className="flex flex-auto">
            {/* Time column */}
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100">
              <div
                className="grid"
                style={{ gridTemplateRows: `repeat(${hours.length}, minmax(3.5rem, 1fr))` }}
              >
                {hours.map((hour) => (
                  <div key={hour} className="relative border-b border-gray-100">
                    <div className="absolute -top-2.5 right-2 text-right text-xs/5 text-gray-400">
                      {hour === 0
                        ? '12AM'
                        : hour < 12
                          ? `${hour}AM`
                          : hour === 12
                            ? '12PM'
                            : `${hour - 12}PM`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day column */}
            <div className="relative flex-1">
              {/* Background grid for this day */}
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateRows: `repeat(${hours.length}, minmax(3.5rem, 1fr))` }}
              >
                {hours.map((hour, i) => (
                  <div
                    key={i}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    onClick={() => onTimeSlotClick?.(currentDate, hour)}
                  />
                ))}
              </div>

              {/* Events for this day */}
              <ol
                className="absolute inset-0 grid grid-cols-1"
                style={{ gridTemplateRows: `repeat(${hours.length * 2}, minmax(0, 1fr))` }}
              >
                {dayEvents.map((event) => {
                  const { gridRow } = calculateEventPositionForDay(event);
                  return (
                    <li key={event.id} className="relative mt-px flex" style={{ gridRow }}>
                      <a
                        href="#"
                        className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${getEventStyle(event)} shadow-sm hover:opacity-80`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEventClick?.(event, e);
                        }}
                      >
                        <p className="order-1 flex items-center gap-1 font-semibold">
                          {event.title}
                          {event.isRecurring && <Repeat className="h-3 w-3 text-blue-500" />}
                        </p>
                        <p className="text-xs opacity-75">
                          <time dateTime={event.startTime.toISOString()}>
                            {event.startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                          {event.type === 'availability' && (
                            <span>
                              {' - '}
                              <time dateTime={event.endTime.toISOString()}>
                                {event.endTime.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </time>
                            </span>
                          )}
                        </p>
                        {event.type === 'availability' && (
                          <div className="text-xs">
                            {event.status === AvailabilityStatus.PENDING && '🟡'}
                            {event.status === AvailabilityStatus.ACCEPTED && '✅'}
                            {event.status === AvailabilityStatus.CANCELLED && '⏸️'}
                            {event.status === AvailabilityStatus.REJECTED && '❌'}
                          </div>
                        )}
                      </a>
                    </li>
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
