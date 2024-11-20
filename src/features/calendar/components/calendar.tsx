'use client';

import { useState } from 'react';

import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { CalendarHeader } from '@/features/calendar/components/calendar-header';
import DayCalendar from '@/features/calendar/components/day';
import { Schedule } from '@/features/calendar/components/schedule';
import WeekCalendar from '@/features/calendar/components/week';

type ViewType = 'day' | 'week' | 'schedule';

interface CalendarProps {
  providerId: string;
  providerName: string;
}

function Calendar({ providerId, providerName }: CalendarProps) {
  const [view, setView] = useState<ViewType>('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const handlePrevious = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() - 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() - 7);
          break;
        default:
          newDate.setDate(prev.getDate() - 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() + 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() + 7);
          break;
        default:
          newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendar = () => {
    const props = {
      currentDate,
      onDateChange: setCurrentDate,
    };

    switch (view) {
      case 'day':
        return <DayCalendar {...props} />;
      case 'week':
        return <WeekCalendar {...props} onViewChange={setView} />;
      case 'schedule':
        return <Schedule {...props} view={view} dateRange={dateRange} />;
      default:
        return <Schedule {...props} />;
    }
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{providerName}&apos;s Availability</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          dateRange={dateRange}
          onDateSelect={(date: Date | undefined) => date && setCurrentDate(date)}
          onDateRangeSelect={setDateRange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onViewChange={setView}
        />
        {renderCalendar()}
      </div>
    </div>
  );
}

export default Calendar;
