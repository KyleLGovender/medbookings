'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState, useTransition } from 'react';

import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { CalendarHeader } from '@/features/calendar/components/calendar-header';
import { CalendarSkeleton } from '@/features/calendar/components/calendar-skeleton';
import { CalendarViewDay } from '@/features/calendar/components/calendar-view-day';
import { CalendarViewSchedule } from '@/features/calendar/components/calendar-view-schedule';
import { CalendarViewWeek } from '@/features/calendar/components/calender-view-week';
import { getDateRange } from '@/features/calendar/lib/helper';
import { getServiceProviderScheduleInRange } from '@/features/calendar/lib/queries';
import { Schedule } from '@/features/calendar/lib/types';

interface CalendarProps {
  initialData: Schedule[];
  serviceProviderId: string;
}

export function CalendarWrapper({ initialData, serviceProviderId }: CalendarProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scheduleData, setScheduleData] = useState<Schedule[]>(initialData);
  const [view, setView] = useState<'day' | 'week' | 'schedule'>('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize dateRange from URL or defaults
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    return {
      from: start ? new Date(start) : new Date(),
      to: end ? new Date(end) : addDays(new Date(), 7),
    };
  });

  console.log('dateRange', dateRange);

  // Update URL when dateRange changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const params = new URLSearchParams(searchParams);
      params.set('start', dateRange.from.toISOString().split('T')[0]);
      params.set('end', dateRange.to.toISOString().split('T')[0]);
      router.replace(`?${params.toString()}`);

      // Fetch updated data
      startTransition(async () => {
        const data = await getServiceProviderScheduleInRange(
          serviceProviderId,
          dateRange.from!,
          dateRange.to!
        );
        setScheduleData(data);
      });
    }
  }, [dateRange, router, searchParams, serviceProviderId]);

  const updateScheduleData = (range: DateRange) => {
    if (!range.from || !range.to) return;

    console.log('Fetching data for range:', range);

    startTransition(async () => {
      const data = await getServiceProviderScheduleInRange(
        serviceProviderId,
        range.from!,
        range.to!
      );
      console.log('Received data:', data);
      setScheduleData(data);
    });
  };

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

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      updateScheduleData(range);
    }
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

  const renderCalendar = () => {
    const props = {
      currentDate,
      onDateChange: setCurrentDate,
    };

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage your Calendar</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          dateRange={dateRange}
          serviceProviderId={serviceProviderId}
          onDateSelect={(date: Date | undefined) => date && setCurrentDate(date)}
          onDateRangeSelect={handleDateRangeSelect}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onViewChange={setView}
          onRefresh={refreshData}
        />
        <Suspense fallback={<CalendarSkeleton />}>{renderCalendar()}</Suspense>
      </div>
    </div>
  );
}
