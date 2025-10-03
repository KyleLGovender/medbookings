import { BookingStatus } from '@prisma/client';

import { calculateSlotTimeRange, getSlotsForDay } from '@/features/calendar/lib/calendar-utils';
import { parseUTC } from '@/lib/timezone';

import { SlotData, SlotDayViewProps } from './types';

// Slot-specific Day View Component
export function SlotDayView({
  currentDate,
  slots,
  workingHours,
  onSlotClick,
  onTimeSlotClick,
  onDateClick,
  getSlotStyle,
}: SlotDayViewProps) {
  const daySlots = getSlotsForDay(slots, currentDate);

  // Calculate display time range using common utility
  const timeRange = calculateSlotTimeRange(daySlots);
  const hours = Array.from(
    { length: timeRange.end - timeRange.start },
    (_, i) => timeRange.start + i
  );

  const HOUR_HEIGHT = 100; // pixels per hour

  // Calculate slot position and height based on time (same as week view)
  const calculateSlotPosition = (slot: SlotData) => {
    const startTime = slot.startTime;
    const endTime = slot.endTime;

    // Calculate position from top (in minutes from start of time range)
    const minutesFromStart = (startTime.getHours() - timeRange.start) * 60 + startTime.getMinutes();
    const top = (minutesFromStart / 60) * HOUR_HEIGHT;

    // Calculate height based on duration
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Min height of 20px

    return { top, height };
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <button
              type="button"
              onClick={() => onDateClick?.(currentDate)}
              className="flex flex-1 items-center justify-center py-3 text-sm/6 text-gray-500 transition-colors hover:bg-gray-50"
            >
              <span>
                {currentDate.toLocaleDateString([], {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </button>
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

            {/* Day column */}
            <div className="relative flex-1">
              {/* Background grid for this day */}
              <div className="absolute inset-0 flex flex-col">
                {hours.map((hour, i) => (
                  <div
                    key={i}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => onTimeSlotClick?.(currentDate, hour)}
                  />
                ))}
              </div>

              {/* Slots positioned absolutely */}
              <div className="absolute inset-0">
                {daySlots.map((slot) => {
                  const { top, height } = calculateSlotPosition(slot);
                  const price = getSlotPrice(slot);
                  const isBooked = !!slot.booking;

                  // Day view has full width available, so more generous with space
                  const approximateWidth = Math.max(200, window.innerWidth - 200); // Full width minus sidebar
                  const hasWideSpace = approximateWidth > 250; // Wide enough for more details
                  const hasMediumSpace = approximateWidth > 150; // Medium space for some details

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={`absolute left-1 right-1 rounded border px-2 text-left transition-all ${getSlotButtonStyle(slot)} ${
                        !isBooked
                          ? 'cursor-pointer hover:z-10 hover:shadow-md'
                          : 'cursor-not-allowed opacity-75'
                      }`}
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
                            {formatTime(slot.startTime)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
