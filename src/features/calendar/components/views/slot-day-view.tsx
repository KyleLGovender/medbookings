import { BookingStatus } from '@prisma/client';
import { MapPin, Monitor } from 'lucide-react';

import {
  calculateEventPosition,
  getEventsForDay,
  getWorkingTimeRange,
} from '@/features/calendar/lib/calendar-utils';

import { SlotData, SlotDayViewProps } from './types';

// Slot-specific Day View Component
export function SlotDayView({
  currentDate,
  events,
  workingHours,
  onEventClick,
  onTimeSlotClick,
  onDateClick,
  getEventStyle,
}: SlotDayViewProps) {
  const daySlots = getEventsForDay(events, currentDate);

  // Calculate display time range based on slots
  const getDisplayTimeRange = () => {
    const defaultStart = 6; // 6 AM
    const defaultEnd = 18; // 6 PM

    let earliestHour = defaultStart;
    let latestHour = defaultEnd;

    // Check all slots to extend range if needed
    daySlots.forEach((slot) => {
      const startHour = new Date(slot.startTime).getHours();
      const endHour = new Date(slot.endTime).getHours();

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

  const calculateSlotGridPosition = (slot: SlotData) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    // Convert to hour-based grid slots, accounting for display range offset
    // The events grid has hours.length * 2 rows, so we need to multiply by 2
    const startHour = startTime.getHours() - timeRange.start;
    const endHour = endTime.getHours() - timeRange.start;
    const startSlot = Math.max(1, startHour * 2 + 1);
    const endSlot = Math.max(startSlot + 1, endHour * 2 + 1);
    const spanSlots = endSlot - startSlot;

    return { gridRow: `${startSlot} / span ${spanSlots}` };
  };

  const getSlotTitle = (slot: SlotData) => {
    if (slot.booking) {
      return 'Booked';
    } else if (slot.service) {
      return slot.service.name;
    } else {
      return 'Available Slot';
    }
  };

  const getSlotPrice = (slot: SlotData) => {
    if (slot.booking) return null;

    if (slot.serviceConfig?.price) {
      return Number(slot.serviceConfig.price);
    } else if (slot.service?.defaultPrice) {
      return Number(slot.service.defaultPrice);
    }
    return null;
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

              {/* Slots for this day */}
              <ol
                className="absolute inset-0 grid grid-cols-1"
                style={{ gridTemplateRows: `repeat(${hours.length * 2}, minmax(0, 1fr))` }}
              >
                {daySlots.map((slot) => {
                  const { gridRow } = calculateSlotGridPosition(slot);
                  const price = getSlotPrice(slot);

                  return (
                    <li key={slot.id} className="relative mt-px flex" style={{ gridRow }}>
                      <a
                        href="#"
                        className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${getEventStyle(slot)} shadow-sm hover:opacity-80`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEventClick?.(slot, e);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="order-1 truncate font-semibold">{getSlotTitle(slot)}</p>
                          {price && <span className="ml-1 text-xs font-semibold">${price}</span>}
                        </div>

                        <p className="text-xs opacity-75">
                          <time dateTime={slot.startTime.toString()}>
                            {new Date(slot.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                          <span>
                            {' - '}
                            <time dateTime={slot.endTime.toString()}>
                              {new Date(slot.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                          </span>
                        </p>

                        {slot.availability?.location && (
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <MapPin className="h-2 w-2 flex-shrink-0" />
                            <span className="truncate">{slot.availability.location.name}</span>
                          </div>
                        )}

                        {slot.availability?.isOnlineAvailable && (
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <Monitor className="h-2 w-2 flex-shrink-0" />
                            <span>Online</span>
                          </div>
                        )}

                        {slot.booking && (
                          <div className="text-xs opacity-75">Status: {slot.booking.status}</div>
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
