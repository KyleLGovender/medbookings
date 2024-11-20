'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { CalendarHeader } from '@/features/calendar/components/calendar-header';
import DayCalendar from '@/features/calendar/components/day';
import { ScheduleCalendar } from '@/features/calendar/components/schedule';
import WeekCalendar from '@/features/calendar/components/week';
import { Schedule } from '@/features/calendar/lib/types';

type ViewType = 'day' | 'week' | 'schedule';

interface CalendarProps {
  initialData: Schedule[];
  providerId: string;
}

function Calendar({ initialData, providerId }: CalendarProps) {
  const [view, setView] = useState<ViewType>('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const { data: scheduleData = initialData } = useQuery({
    queryKey: ['schedule', providerId, dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.from,
          endDate: dateRange.to,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      return response.json();
    },
    initialData,
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
        return <ScheduleCalendar scheduleData={scheduleData} />;
      default:
        return <ScheduleCalendar scheduleData={scheduleData} />;
    }
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage your Calendar</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          dateRange={dateRange}
          onDateSelect={(date: Date | undefined) => date && setCurrentDate(date)}
          onDateRangeSelect={(range: DateRange | undefined) => range && setDateRange(range)}
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
