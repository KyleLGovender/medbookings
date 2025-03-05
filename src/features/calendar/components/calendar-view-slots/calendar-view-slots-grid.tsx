'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { generateDaysForWeekCalendar } from '@/features/calendar/lib/helper';
import { AvailabilitySlot, AvailabilityView } from '@/features/calendar/lib/types';

interface CalendarViewSlotsGridProps {
  rangeStartDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (slot: AvailabilitySlot) => void;
  onEdit: (availability: AvailabilityView) => void;
  selectedServiceId?: string;
}

function formatDateRange(weekDays: { date: Date }[]): string {
  if (!weekDays.length) return '';

  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  return `${startDate.toLocaleDateString('en-US', { weekday: 'short' })} ${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { weekday: 'short' })} ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })}`;
}

export function CalendarViewSlotsGrid({
  rangeStartDate,
  onDateChange,
  onViewChange = () => {},
  availabilityData = [],
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
  selectedServiceId,
}: CalendarViewSlotsGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    return generateDaysForWeekCalendar(rangeStartDate);
  }, [rangeStartDate]);

  // Generate time slots (9:00 to 17:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(new Date(new Date().setHours(hour, 0, 0, 0)));
    }
    return slots;
  }, []);

  // Organize slots by day and hour
  const organizedSlots = useMemo(() => {
    // 1. Create the full week structure first
    const weekStructure = new Map<string, Map<number, AvailabilitySlot[]>>();

    // Build empty week structure
    weekDays.forEach(({ date }) => {
      const dayKey = date.toISOString().split('T')[0];
      const dayHours = new Map<number, AvailabilitySlot[]>();

      // Initialize every hour slot for this day (9:00-17:00)
      for (let hour = 9; hour <= 17; hour++) {
        dayHours.set(hour, []);
      }

      weekStructure.set(dayKey, dayHours);
    });

    console.log('Empty Week Structure:', weekStructure);

    // 2. Only populate with availability data if a service is selected
    if (selectedServiceId) {
      const allSlots = availabilityData.flatMap((availability) => availability.slots);
      console.log('Available Slots:', allSlots);

      // Populate the week structure with matching slots
      allSlots.forEach((slot) => {
        if (slot.service.id === selectedServiceId) {
          const slotDate = new Date(slot.startTime);
          const dayKey = slotDate.toISOString().split('T')[0];
          const hour = slotDate.getHours();

          // Only add if the slot falls within our 9-17 range
          if (hour >= 9 && hour <= 17) {
            const daySlots = weekStructure.get(dayKey);
            const hourSlots = daySlots?.get(hour) || [];
            daySlots?.set(hour, [...hourSlots, slot]);
          }
        }
      });
    }

    console.log('Populated Week Structure:', weekStructure);
    return weekStructure;
  }, [availabilityData, selectedServiceId, weekDays]);

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

  console.log('Selected Service ID:', selectedServiceId);
  console.log('organizedSlots:', organizedSlots);

  // Update color logic to use outline styles
  const getSlotColor = useCallback((slot: AvailabilitySlot) => {
    const now = new Date();
    const startTime = new Date(slot.startTime);

    if (startTime < now) {
      return 'border-gray-200 text-gray-400 hover:border-gray-300 cursor-not-allowed';
    }
    if (slot.booking) {
      return 'border-blue-500 text-blue-500 hover:border-blue-600';
    }
    return 'border-green-500 text-green-500 hover:border-green-600';
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

          <div className="flex flex-auto">
            {/* Time column */}
            <div className="sticky left-0 z-20 w-14 flex-none bg-white">
              <div className="grid grid-cols-1">
                {timeSlots.map((timeSlot) => (
                  <div
                    key={timeSlot.getTime()}
                    className="flex h-20 items-center justify-end border-b border-gray-100 pr-2 text-xs text-gray-500"
                  >
                    {timeSlot.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Days grid */}
            <div className="grid flex-auto grid-cols-7 divide-x divide-gray-100">
              {weekDays.map((day) => {
                const dayKey = day.date.toISOString().split('T')[0];
                const daySlots = organizedSlots.get(dayKey);

                return (
                  <div key={dayKey} className="relative">
                    <div className="grid grid-cols-1">
                      {timeSlots.map((timeSlot) => {
                        const hourSlots = daySlots?.get(timeSlot.getHours()) || [];

                        return (
                          <div
                            key={timeSlot.getTime()}
                            className="h-20 border-b border-gray-100 p-1"
                          >
                            {hourSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => onView(slot)}
                                className={`w-full rounded-md border px-2 py-1 text-xs ${getSlotColor(slot)}`}
                              >
                                {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                              </button>
                            ))}
                          </div>
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
