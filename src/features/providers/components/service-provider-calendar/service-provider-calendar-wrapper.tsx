'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState, useTransition } from 'react';

import { startOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { CalendarSkeleton } from '@/components/calendar/calendar-utils/calendar-skeleton';
import { CalendarViewDay } from '@/components/calendar/calendar-view-day';
import { CalendarViewSchedule } from '@/components/calendar/calendar-view-schedule';
import { CalendarViewWeek } from '@/components/calendar/calendar-view-week';
import { AvailabilityFormDialog } from '@/features/calendar/components/availability-form/availability-form-dialog';
import { AvailabilityViewDialog } from '@/features/calendar/components/availability-view/availability-view-dialog';
import { ServiceProviderCalendarHeader } from '@/features/calendar/components/service-provider-calendar/service-provider-calendar-header';
import { getServiceProviderAvailabilityInRange } from '@/features/calendar/lib/queries';
import { AvailabilityView, ServiceProviderCalendarViewType } from '@/features/calendar/lib/types';
import {
  getDateRange,
  getDistinctServices,
  getNextDate,
  getPreviousDate,
  getTimeRangeOfMultipleAvailabilityView,
} from '@/lib/calendar-helper';

interface ServiceProviderCalendarWrapperProps {
  initialAvailability: AvailabilityView[];
  serviceProviderId: string;
  initialDateRange: DateRange;
  initialView: ServiceProviderCalendarViewType;
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
  const [view, setView] = useState<ServiceProviderCalendarViewType>(initialView);
  const [timeRange, setTimeRange] = useState(() =>
    getTimeRangeOfMultipleAvailabilityView(initialAvailability)
  );
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityView | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(() => {
    if (availabilityData?.length) {
      const distinctServices = getDistinctServices(availabilityData);

      // Auto-select if only one service
      if (distinctServices.length === 1) {
        return distinctServices[0].id;
      }
    }
    return undefined;
  });

  const rangeStartDate = dateRange.from!;

  // Update time range whenever availability data changes
  useEffect(() => {
    setTimeRange(getTimeRangeOfMultipleAvailabilityView(availabilityData));
  }, [availabilityData]);

  const updateUrlParams = (updates: { range?: DateRange; view?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.range) {
      params.delete('start');
      params.delete('end');

      if (updates.range.from) {
        const localDate = new Date(updates.range.from);
        const startDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        params.set('start', startDate);
      }
      if (updates.range.to) {
        const localDate = new Date(updates.range.to);
        const endDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        params.set('end', endDate);
      }
    }

    if (updates.view) {
      params.set('view', updates.view);

      // Only set to today if there's no range provided and we're switching to week/day/slots view
      if (
        (updates.view === 'week' || updates.view === 'day' || updates.view === 'slots') &&
        !updates.range
      ) {
        const localToday = new Date();
        const startDate = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
        params.set('start', startDate);
        params.delete('end');
      }
    }

    // Correct approach for Next.js 14 App Router
    const queryString = params.toString();
    router.replace(`/profile/service-provider/calendar${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  };

  const handleViewChange = (newView: ServiceProviderCalendarViewType) => {
    setView(newView);

    // Keep existing range for schedule view, but update URL
    if (newView === 'schedule') {
      updateUrlParams({ view: newView });
      return;
    }

    // For week and slots views, show current week
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
      const newRange = getDateRange(today, newView);
      setDateRange(newRange);
      updateUrlParams({ range: newRange, view: newView });
      updateAvailabilityData(newRange);
    }
  };

  const handleDateSelect = (
    newDate: Date | undefined,
    fromView: ServiceProviderCalendarViewType
  ) => {
    if (!newDate) return;

    // Set view based on context - if coming from week view, go to day view
    const newView = fromView === 'week' ? 'day' : view === 'day' ? 'day' : 'day';
    setView(newView);

    console.log('fromView', fromView);
    console.log('newView', newView);

    // Update the range for the selected view
    const range = getDateRange(newDate, newView);
    setDateRange(range);
    updateUrlParams({ range, view: newView });
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

  const handleServiceSelect = (serviceId: string | undefined) => {
    setSelectedServiceId(serviceId);
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
      onViewChange: setView,
    };

    switch (view) {
      case 'day':
        return <CalendarViewDay {...props} timeRange={timeRange} />;
      case 'week':
        return <CalendarViewWeek {...props} timeRange={timeRange} />;
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
          availabilityData={availabilityData}
          selectedServiceId={selectedServiceId}
          onServiceSelect={handleServiceSelect}
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
