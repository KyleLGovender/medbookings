'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState, useTransition } from 'react';

import { startOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { CalendarHeader } from '@/features/calendar/components/calendar-header';
import { CalendarSkeleton } from '@/features/calendar/components/calendar-skeleton';
import { CalendarViewDay } from '@/features/calendar/components/calendar-view-day';
import { CalendarViewSchedule } from '@/features/calendar/components/calendar-view-schedule';
import { CalendarViewWeek } from '@/features/calendar/components/calendar-view-week';
import { getDateRange, getNextDate, getPreviousDate } from '@/features/calendar/lib/helper';
import { getServiceProviderScheduleInRange } from '@/features/calendar/lib/queries';
import { Schedule } from '@/features/calendar/lib/types';

interface CalendarWrapperProps {
  initialData: Schedule[];
  serviceProviderId: string;
  initialDateRange: DateRange;
  initialView: 'day' | 'week' | 'schedule';
}

export function CalendarWrapper({
  initialData,
  serviceProviderId,
  initialDateRange,
  initialView,
}: CalendarWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [scheduleData, setScheduleData] = useState<Schedule[]>(initialData);
  const [view, setView] = useState<'day' | 'week' | 'schedule'>(initialView);

  const rangeStartDate = dateRange.from!;

  const updateUrlParams = (updates: { range?: DateRange; view?: string }) => {
    const params = new URLSearchParams(searchParams);

    // Only clear dates if we're updating the range
    if (updates.range) {
      params.delete('start');
      params.delete('end');

      if (updates.range.from) {
        params.set('start', updates.range.from.toISOString().split('T')[0]);
      }
      if (updates.range.to) {
        params.set('end', updates.range.to.toISOString().split('T')[0]);
      }
    }

    // Set view parameter if provided
    if (updates.view) {
      params.set('view', updates.view);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleViewChange = (newView: 'day' | 'week' | 'schedule') => {
    setView(newView);
    updateUrlParams({ view: newView });
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      return;
    }

    // Get new range and update data
    const range = getDateRange(newDate, view);

    // Update all three: state, URL, and data
    setDateRange(range);
    updateUrlParams({ range });
    updateScheduleData(range);
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

  const handlePrevious = () => {
    const newDate = getPreviousDate(dateRange.from!, view);
    const range = getDateRange(newDate, view);
    setDateRange(range);
    updateUrlParams({ range });
    updateScheduleData(range);
  };

  const handleNext = () => {
    const newDate = getNextDate(dateRange.from!, view);
    const range = getDateRange(newDate, view);
    setDateRange(range);
    updateUrlParams({ range });
    updateScheduleData(range);
  };

  const handleToday = () => {
    const today = new Date();
    const newRange = getDateRange(today, view);

    setDateRange(newRange);
    updateUrlParams({ range: newRange });
    updateScheduleData(newRange);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
    const newRange = getDateRange(weekStart, view);

    setDateRange(newRange);
    updateUrlParams({ range: newRange });
    updateScheduleData(newRange);
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
      rangeStartDate,
      scheduleData,
      onDateChange: handleDateSelect,
    };

    switch (view) {
      case 'day':
        return (
          <CalendarViewDay
            {...props}
            serviceProviderId={serviceProviderId}
            onRefresh={refreshData}
            onViewChange={setView}
          />
        );
      case 'week':
        return (
          <CalendarViewWeek
            {...props}
            serviceProviderId={serviceProviderId}
            onRefresh={refreshData}
            onViewChange={setView}
          />
        );
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
          rangeStartDate={rangeStartDate}
          dateRange={dateRange}
          serviceProviderId={serviceProviderId}
          onDateSelect={handleDateSelect}
          onDateRangeSelect={handleDateRangeSelect}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onThisWeek={handleThisWeek}
          onViewChange={handleViewChange}
          onRefresh={refreshData}
        />
        <Suspense fallback={<CalendarSkeleton />}>{renderCalendar()}</Suspense>
      </div>
    </div>
  );
}
