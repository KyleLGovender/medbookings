'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState, useTransition } from 'react';

import { DateRange } from 'react-day-picker';

import { CalendarHeader } from '@/features/calendar/components/calendar-header';
import { CalendarSkeleton } from '@/features/calendar/components/calendar-skeleton';
import { CalendarViewDay } from '@/features/calendar/components/calendar-view-day';
import { CalendarViewSchedule } from '@/features/calendar/components/calendar-view-schedule';
import { CalendarViewWeek } from '@/features/calendar/components/calendar-view-week';
import { getDateRange } from '@/features/calendar/lib/helper';
import { getServiceProviderScheduleInRange } from '@/features/calendar/lib/queries';
import { Schedule } from '@/features/calendar/lib/types';

interface CalendarWrapperProps {
  initialData: Schedule[];
  serviceProviderId: string;
  initialDateRange: DateRange;
  initialView?: 'day' | 'week' | 'schedule';
  initialDate?: Date;
}

export function CalendarWrapper({
  initialData,
  serviceProviderId,
  initialDateRange,
  initialView = 'schedule',
  initialDate,
}: CalendarWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize with props instead of reading URL directly
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [scheduleData, setScheduleData] = useState<Schedule[]>(initialData);
  const [view, setView] = useState<'day' | 'week' | 'schedule'>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());

  const updateUrlParams = (updates: { range?: DateRange; view?: string; date?: Date }) => {
    const params = new URLSearchParams(searchParams);

    // Clear existing date-related params
    params.delete('start');
    params.delete('end');
    params.delete('date');

    // Set new params based on what was provided
    if (updates.range?.from && updates.range.to) {
      params.set('start', updates.range.from.toISOString().split('T')[0]);
      params.set('end', updates.range.to.toISOString().split('T')[0]);
    } else if (updates.date) {
      params.set('date', updates.date.toISOString().split('T')[0]);
    }

    if (updates.view) {
      params.set('view', updates.view);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleViewChange = (newView: 'day' | 'week' | 'schedule') => {
    setView(newView);
    updateUrlParams({ view: newView });
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    setCurrentDate(newDate);
    updateUrlParams({ date: newDate });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    // If range is undefined or incomplete, just update the state
    setDateRange(range || { from: undefined, to: undefined });

    // Only update URL and fetch data when we have a complete range
    if (range?.from && range?.to) {
      updateUrlParams({ range });
      startTransition(async () => {
        const data = await getServiceProviderScheduleInRange(
          serviceProviderId,
          range.from!,
          range.to!
        );
        setScheduleData(data);
      });
    }
  };

  console.log('CalendarWrapper - Current state:', {
    view,
    currentDate,
    scheduleDataCount: scheduleData.length,
    dateRange,
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
      const range = getDateRange(newDate, view);
      setDateRange(range);
      updateScheduleData(range);
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
      const range = getDateRange(newDate, view);
      setDateRange(range);
      updateScheduleData(range);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    const range = getDateRange(new Date(), view);
    setDateRange(range);
    updateScheduleData(range);
  };

  const refreshData = useCallback(async () => {
    startTransition(async () => {
      const data = await getServiceProviderScheduleInRange(
        serviceProviderId,
        dateRange.from!,
        dateRange.to!
      );
      setScheduleData(data);
    });
  }, [serviceProviderId, dateRange]);

  const updateScheduleData = (range: DateRange) => {
    startTransition(async () => {
      const data = await getServiceProviderScheduleInRange(
        serviceProviderId,
        range.from!,
        range.to!
      );
      setScheduleData(data);
    });
  };

  const renderCalendar = () => {
    const props = {
      currentDate,
      scheduleData,
      onDateChange: setCurrentDate,
    };

    console.log('renderCalendar - Passing props:', {
      view,
      scheduleDataCount: scheduleData.length,
      currentDate: currentDate.toISOString(),
    });

    switch (view) {
      case 'day':
        return <CalendarViewDay {...props} />;
      case 'week':
        return <CalendarViewWeek {...props} onViewChange={setView} />;
      case 'schedule':
        return (
          <CalendarViewSchedule
            scheduleData={scheduleData}
            serviceProviderId={serviceProviderId}
            onRefresh={refreshData}
          />
        );
      default:
        return (
          <CalendarViewSchedule
            scheduleData={scheduleData}
            serviceProviderId={serviceProviderId}
            onRefresh={refreshData}
          />
        );
    }
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="rounded-lg bg-white shadow">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          dateRange={dateRange}
          serviceProviderId={serviceProviderId}
          onDateSelect={handleDateChange}
          onDateRangeSelect={handleDateRangeSelect}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onViewChange={handleViewChange}
          onRefresh={refreshData}
        />
        <Suspense fallback={<CalendarSkeleton />}>{renderCalendar()}</Suspense>
      </div>
    </div>
  );
}
