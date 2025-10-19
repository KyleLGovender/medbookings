import { BookingStatus } from '@prisma/client';

import { calculateSlotTimeRange, getSlotsForDay } from '@/features/calendar/lib/calendar-utils';
import { cn } from '@/lib/utils';

import { SlotData, SlotWeekViewProps } from './types';

// Improved Slot Week View with button-style slots and proper time positioning
export function SlotWeekView({
  currentDate,
  slots,
  workingHours,
  onSlotClick,
  onTimeSlotClick,
  onDateClick,
  getSlotStyle,
}: SlotWeekViewProps) {
  // Start week on Monday
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = currentDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(currentDate.getDate() - daysFromMonday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  // Calculate display time range using common utility
  const timeRange = calculateSlotTimeRange(slots);

  const hours = Array.from(
    { length: timeRange.end - timeRange.start },
    (_, i) => timeRange.start + i
  );

  const HOUR_HEIGHT = 100; // pixels per hour

  // Calculate slot position and height based on time
  const calculateSlotPosition = (slot: SlotData) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    // Calculate position from top (in minutes from start of time range)
    const minutesFromStart = (startTime.getHours() - timeRange.start) * 60 + startTime.getMinutes();
    const top = (minutesFromStart / 60) * HOUR_HEIGHT;

    // Calculate height based on duration
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Min height of 20px

    return { top, height };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSlotButtonStyle = (slot: SlotData) => {
    if (slot.booking) {
      switch (slot.booking.status) {
        case BookingStatus.CONFIRMED:
          return 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900';
        case BookingStatus.PENDING:
          return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900';
        case BookingStatus.CANCELLED:
          return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-500';
        case BookingStatus.COMPLETED:
          return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900';
        case BookingStatus.NO_SHOW:
          return 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900';
        default:
          return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900';
      }
    }
    return 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900';
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
      {/* Header */}
      <div className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex">
          <div className="w-14 flex-none bg-white p-2 text-center text-sm font-medium text-gray-500">
            Time
          </div>
          <div className="flex flex-auto">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onDateClick?.(day)}
                className="flex flex-1 items-center justify-center border-l border-gray-100 py-3 text-sm/6 text-gray-500 transition-colors hover:bg-gray-50"
              >
                <span>
                  {day.toLocaleDateString([], { weekday: 'short' })}{' '}
                  <span className="font-semibold text-gray-900">{day.getDate()}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="flex max-w-full flex-none flex-col">
          <div className="flex flex-auto">
            {/* Time column */}
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100">
              <div className="flex flex-col">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="relative border-b border-gray-100"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
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

            {/* Day columns */}
            <div className="flex flex-auto divide-x divide-gray-100">
              {days.map((day, dayIndex) => {
                const daySlots = getSlotsForDay(slots, day);

                return (
                  <div key={dayIndex} className="relative flex-1">
                    {/* Background grid for this day */}
                    <div className="absolute inset-0 flex flex-col">
                      {hours.map((hour, i) => (
                        <div
                          key={i}
                          className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          onClick={() => onTimeSlotClick?.(day, hour)}
                        />
                      ))}
                    </div>

                    {/* Slots positioned absolutely */}
                    <div className="absolute inset-0">
                      {daySlots.map((slot) => {
                        const { top, height } = calculateSlotPosition(slot);
                        const price = getSlotPrice(slot);
                        const isBooked = !!slot.booking;

                        // Calculate approximate available width (each day is 1/7 of the container minus borders and padding)
                        // This is an approximation since we can't measure the actual DOM element width
                        const approximateWidth = Math.max(60, (window.innerWidth - 200) / 7); // Subtract sidebar and padding, min 60px
                        const hasWideSpace = approximateWidth > 120; // Wide enough for more details
                        const hasMediumSpace = approximateWidth > 80; // Medium space for some details

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={cn(
                              'absolute left-1 right-1 rounded border px-2 text-left transition-all',
                              getSlotButtonStyle(slot),
                              !isBooked && 'cursor-pointer hover:z-10 hover:shadow-md',
                              isBooked && 'cursor-not-allowed opacity-75'
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              minHeight: '20px',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotClick?.(slot, e);
                            }}
                            disabled={isBooked}
                          >
                            <div className="flex h-full flex-col justify-center">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                  {formatTime(new Date(slot.startTime))}
                                </span>
                                {price && !isBooked && height > 25 && hasMediumSpace && (
                                  <span className="text-xs font-bold">R{price}</span>
                                )}
                              </div>
                              {height > 35 && hasMediumSpace && (
                                <div className="truncate text-xs opacity-75">
                                  {slot.service?.name || 'Available'}
                                </div>
                              )}
                              {height > 50 && slot.booking && hasWideSpace && (
                                <div className="truncate text-xs opacity-60">
                                  {slot.booking.guestName || 'Booked'}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
