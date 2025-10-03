import { AvailabilityStatus } from '@prisma/client';
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react';

import {
  getAvailabilityForDay,
  getAvailabilityStyle,
  getWorkingTimeRange,
} from '@/features/calendar/lib/calendar-utils';
import { nowUTC, parseUTC } from '@/lib/timezone';

import { AvailabilityData, AvailabilityMonthViewProps } from './types';

// Availability-specific Month View Component
export function AvailabilityMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onEditEvent,
  onDeleteEvent,
  getAvailabilityStyle,
}: AvailabilityMonthViewProps) {
  const firstDayOfMonth = nowUTC();
  firstDayOfMonth.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfCalendar = nowUTC();
  firstDayOfCalendar.setTime(firstDayOfMonth.getTime());

  // Adjust to start on Monday (matching original pattern)
  const dayOfWeek = firstDayOfMonth.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  firstDayOfCalendar.setDate(firstDayOfMonth.getDate() - daysFromMonday);

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = nowUTC();
    day.setTime(firstDayOfCalendar.getTime());
    day.setDate(firstDayOfCalendar.getDate() + i);
    return day;
  });

  const handleEventClick = (availability: AvailabilityData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEventClick) {
      onEventClick(availability, event);
    }
  };

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleEditEvent = (availability: AvailabilityData) => {
    if (onEditEvent) {
      onEditEvent(availability);
    }
  };

  const handleDeleteEvent = (availability: AvailabilityData) => {
    if (onDeleteEvent) {
      onDeleteEvent(availability);
    }
  };

  const isToday = (date: Date) => {
    const today = nowUTC();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isCurrentDate = (date: Date) => {
    return date.toDateString() === currentDate.toDateString();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Month Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </h3>
          <div className="text-sm text-gray-500">
            {events.length} {events.length === 1 ? 'availability' : 'availabilities'} this month
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7" style={{ minHeight: '100%' }}>
          {days.map((date) => {
            const dayEvents = getAvailabilityForDay(events, date);
            const isCurrentMonthDate = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isCurrentDate(date);

            return (
              <div
                key={date.toISOString()}
                className={`relative min-h-32 cursor-pointer border-b border-r border-gray-200 p-2 transition-colors hover:bg-gray-50 ${
                  !isCurrentMonthDate ? 'bg-gray-50 text-gray-400' : ''
                } ${isTodayDate ? 'bg-blue-50' : ''} ${isSelectedDate ? 'bg-indigo-50' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {/* Date Number */}
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate
                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                        : isSelectedDate
                          ? 'text-indigo-600'
                          : isCurrentMonthDate
                            ? 'text-gray-900'
                            : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-500">{dayEvents.length}</span>
                  )}
                </div>

                {/* Availability Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((availability) => {
                    const startTime = availability.startTime;
                    const endTime = availability.endTime;

                    return (
                      <div
                        key={availability.id}
                        className={`cursor-pointer truncate rounded px-2 py-1 text-xs ${getAvailabilityStyle(availability)} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                        tabIndex={0}
                        onClick={(e) => handleEventClick(availability, e)}
                        onDoubleClick={() => handleEditEvent(availability)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteEvent(availability);
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditEvent(availability);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // For now, open edit on right-click. Could add context menu later.
                          handleEditEvent(availability);
                        }}
                        title="Double-click to edit, Delete key to delete, Right-click for options"
                      >
                        <div className="flex items-center space-x-1">
                          {availability.isRecurring && <Repeat className="h-3 w-3 flex-shrink-0" />}
                          <div className="truncate">
                            <div className="truncate font-medium">
                              {availability.provider?.user?.name || 'Provider'}
                            </div>
                            <div className="opacity-75">
                              {startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show "+X more" if there are more than 3 events */}
                  {dayEvents.length > 3 && (
                    <div className="px-2 text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
