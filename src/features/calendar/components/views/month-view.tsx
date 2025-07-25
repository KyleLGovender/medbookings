import { Repeat } from 'lucide-react';

import { AvailabilityStatus } from '@/features/calendar/types/types';
import { getEventsForDay } from '@/features/calendar/lib/calendar-utils';

import { MonthViewProps } from './types';

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onEditEvent,
  getEventStyle,
}: MonthViewProps) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfCalendar = new Date(firstDayOfMonth);

  // Adjust to start on Monday
  const dayOfWeek = firstDayOfMonth.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  firstDayOfCalendar.setDate(firstDayOfMonth.getDate() - daysFromMonday);

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(firstDayOfCalendar);
    day.setDate(firstDayOfCalendar.getDate() + i);
    return day;
  });

  const getEventsForDayLocal = (date: Date) => {
    return getEventsForDay(events, date);
  };

  return (
    <>
      <div className="isolate overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
        {/* Day headers with Tailwind calendar styling */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="bg-white py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days with Tailwind calendar styling */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 text-sm">
          {days.map((day, index) => {
            const dayEvents = getEventsForDayLocal(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === currentDate.toDateString();

            return (
              <button
                key={index}
                type="button"
                onClick={() => onDateClick?.(day)}
                className={`min-h-[120px] bg-white p-2 text-left transition-colors hover:bg-gray-50 focus:z-10 ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'} ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'bg-blue-100' : ''} `}
              >
                <time
                  dateTime={day.toISOString().split('T')[0]}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-blue-600 text-white' : ''} ${isSelected && !isToday ? 'bg-gray-900 text-white' : ''} `}
                >
                  {day.getDate()}
                </time>
                <div className="mt-2 space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`cursor-pointer rounded border p-1 text-xs shadow-sm transition-shadow hover:shadow-md ${getEventStyle(event)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event, e);
                      }}
                    >
                      <div className="flex items-center gap-1 truncate font-medium">
                        {event.title}
                        {event.isRecurring && (
                          <Repeat className="h-3 w-3 flex-shrink-0 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs opacity-75">
                        {event.startTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {event.type === 'availability' && (
                          <span className="ml-1">
                            {event.status === AvailabilityStatus.PENDING && '🟡'}
                            {event.status === AvailabilityStatus.ACCEPTED && '✅'}
                            {event.status === AvailabilityStatus.CANCELLED && '⏸️'}
                            {event.status === AvailabilityStatus.REJECTED && '❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
