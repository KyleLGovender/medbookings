'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState, useTransition } from 'react';

import { startOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { AvailabilityFormDialog } from '@/features/calendar/components/availability-form-dialog';
import { AvailabilityViewDialog } from '@/features/calendar/components/availability-view-dialog';
import { CalendarSkeleton } from '@/features/calendar/components/calendar-skeleton';
import { CalendarViewDay } from '@/features/calendar/components/calendar-view-day';
import { CalendarViewSchedule } from '@/features/calendar/components/calendar-view-schedule';
import { CalendarViewWeek } from '@/features/calendar/components/calendar-view-week';
import { ServiceProviderCalendarHeader } from '@/features/calendar/components/service-provider-calendar-header';
import { getDateRange, getNextDate, getPreviousDate } from '@/features/calendar/lib/helper';
import { getServiceProviderAvailabilityInRange } from '@/features/calendar/lib/queries';
import { AvailabilityView } from '@/features/calendar/lib/types';

interface ServiceProviderCalendarWrapperProps {
  initialAvailability: AvailabilityView[];
  serviceProviderId: string;
  initialDateRange: DateRange;
  initialView: 'day' | 'week' | 'schedule';
}

export function ServiceProviderCalendarWrapper({
  initialAvailability,
  serviceProviderId,
  initialDateRange,
  initialView,
}: ServiceProviderCalendarWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityView[]>(initialAvailability);
  const [view, setView] = useState<'day' | 'week' | 'schedule'>(initialView);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityView | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const rangeStartDate = dateRange.from!;

  const updateUrlParams = (updates: { range?: DateRange; view?: string }) => {
    const params = new URLSearchParams(searchParams);

    if (updates.range) {
      params.delete('start');
      params.delete('end');

      if (updates.range.from) {
        // Use local date components for URL
        const localDate = new Date(updates.range.from);
        const startDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        params.set('start', startDate);
      }
      if (updates.range.to) {
        // Use local date components for URL
        const localDate = new Date(updates.range.to);
        const endDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        params.set('end', endDate);
      }
    }

    if (updates.view) {
      params.set('view', updates.view);

      // Only set to today if there's no range provided and we're switching to week/day view
      if ((updates.view === 'week' || updates.view === 'day') && !updates.range) {
        const localToday = new Date();
        const startDate = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
        params.set('start', startDate);
        params.delete('end');
      }
    }

    const newUrl = `?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  const handleViewChange = (newView: 'day' | 'week' | 'schedule') => {
    setView(newView);

    // Keep existing range for schedule view, but update URL
    if (newView === 'schedule') {
      updateUrlParams({ view: newView });
      return;
    }

    // For week view, show current week
    if (newView === 'week') {
      const today = new Date();
      const newRange = getDateRange(today, 'week');
      setDateRange(newRange);
      updateUrlParams({ range: newRange, view: newView });
      updateAvailabilityData(newRange);
      return;
    }

    // For day view, show today
    if (newView === 'day') {
      const today = new Date();
      const newRange = getDateRange(today, 'day');
      setDateRange(newRange);
      updateUrlParams({ range: newRange, view: newView });
      updateAvailabilityData(newRange);
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;

    // First set the view to day
    setView('day');

    // Then update the range for day view
    const range = getDateRange(newDate, 'day');
    setDateRange(range);
    updateUrlParams({ range, view: 'day' });
    updateAvailabilityData(range);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    // If range is undefined or incomplete, just update the state
    setDateRange(range || { from: undefined, to: undefined });

    // Only update URL and fetch data when we have a complete range
    if (range?.from && range?.to) {
      updateUrlParams({ range });
      startTransition(async () => {
        const data = await getServiceProviderAvailabilityInRange(
          serviceProviderId,
          range.from!,
          range.to!
        );
        setAvailabilityData(data);
      });
    }
  };

  const handlePrevious = () => {
    const newDate = getPreviousDate(dateRange.from!, view);
    const range = getDateRange(newDate, view);
    setDateRange(range);
    updateUrlParams({ range });
    updateAvailabilityData(range);
  };

  const handleNext = () => {
    const newDate = getNextDate(dateRange.from!, view);
    const range = getDateRange(newDate, view);
    setDateRange(range);
    updateUrlParams({ range });
    updateAvailabilityData(range);
  };

  const handleToday = () => {
    const today = new Date();
    const newRange = getDateRange(today, view);

    setDateRange(newRange);
    updateUrlParams({ range: newRange });
    updateAvailabilityData(newRange);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
    const newRange = getDateRange(weekStart, view);

    setDateRange(newRange);
    updateUrlParams({ range: newRange });
    updateAvailabilityData(newRange);
  };

  const refreshData = useCallback(async () => {
    startTransition(async () => {
      const data = await getServiceProviderAvailabilityInRange(
        serviceProviderId,
        dateRange.from!,
        dateRange.to!
      );
      setAvailabilityData(data);
    });
  }, [serviceProviderId, dateRange]);

  const updateAvailabilityData = (range: DateRange) => {
    startTransition(async () => {
      const data = await getServiceProviderAvailabilityInRange(
        serviceProviderId,
        range.from!,
        range.to!
      );
      setAvailabilityData(data);
    });
  };

  const handleView = (availability: AvailabilityView) => {
    setSelectedAvailability(availability);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (availability: AvailabilityView) => {
    setSelectedAvailability(availability);
    setIsEditDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedAvailability(undefined);
    }
  };

  const handleViewDialogChange = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedAvailability(undefined);
    }
  };

  const renderCalendar = () => {
    const props = {
      rangeStartDate,
      availabilityData,
      onDateChange: handleDateSelect,
      serviceProviderId,
      onRefresh: refreshData,
      onView: handleView,
      onEdit: handleEdit,
    };

    switch (view) {
      case 'day':
        return <CalendarViewDay {...props} onViewChange={setView} />;
      case 'week':
        return <CalendarViewWeek {...props} onViewChange={setView} />;
      case 'schedule':
        return <CalendarViewSchedule {...props} />;
      default:
        return <CalendarViewSchedule {...props} />;
    }
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="rounded-lg bg-white shadow">
        <ServiceProviderCalendarHeader
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

      <AvailabilityFormDialog
        availability={selectedAvailability}
        serviceProviderId={serviceProviderId}
        mode="edit"
        open={isEditDialogOpen}
        onOpenChange={handleDialogChange}
        onRefresh={refreshData}
      />
      <AvailabilityViewDialog
        availability={selectedAvailability}
        open={isViewDialogOpen}
        onOpenChange={handleViewDialogChange}
      />
    </div>
  );
}
