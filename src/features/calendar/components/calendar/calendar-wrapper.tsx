'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { startOfWeek } from 'date-fns';
import { debounce } from 'lodash';
import { DateRange } from 'react-day-picker';

import { CalendarSkeleton } from '@/features/calendar/components/calendar-utils/calendar-skeleton';
import { CalendarViewSlots } from '@/features/calendar/components/calendar-view-slots/index';
import { CalendarHeader } from '@/features/calendar/components/calendar/calendar-header';
import {
  getDateRange,
  getDistinctServices,
  getNextDate,
  getPreviousDate,
  getTimeRangeOfMultipleAvailabilityView,
} from '@/features/calendar/lib/helper';
import { getServiceProviderAvailabilityInRange } from '@/features/calendar/lib/queries';
import { AvailabilityView, CalendarViewType } from '@/features/calendar/lib/types';

interface CalendarWrapperProps {
  initialAvailability: AvailabilityView[];
  serviceProviderId: string;
  initialDateRange: DateRange;
  initialView: CalendarViewType;
}

export function CalendarWrapper({
  initialAvailability,
  serviceProviderId,
  initialDateRange,
  initialView,
}: CalendarWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityView[]>(initialAvailability);
  const [view, setView] = useState<CalendarViewType>(initialView);
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

  const debouncedUpdateUrl = useCallback(
    (url: string) => {
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const debouncedUrlUpdate = useMemo(() => debounce(debouncedUpdateUrl, 300), [debouncedUpdateUrl]);

  const updateUrlParams = useCallback(
    (updates: { range?: DateRange; view?: string }) => {
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

      const queryString = params.toString();
      debouncedUrlUpdate(
        `/calendar/service-provider/${serviceProviderId}/${queryString ? `?${queryString}` : ''}`
      );
    },
    [searchParams, debouncedUrlUpdate, serviceProviderId]
  );

  const updateAvailabilityData = useCallback(
    (range: DateRange) => {
      startTransition(async () => {
        const data = await getServiceProviderAvailabilityInRange(
          serviceProviderId,
          range.from!,
          range.to!
        );
        setAvailabilityData(data);
      });
    },
    [serviceProviderId]
  );

  const handleViewChange = useCallback(
    (view: CalendarViewType) => {
      setView(view);

      if (view === 'slots') {
        const today = new Date();
        const newRange = getDateRange(today, 'week');
        setDateRange(newRange);
        updateUrlParams({ range: newRange, view: view });
        updateAvailabilityData(newRange);
        return;
      }
    },
    [updateAvailabilityData, updateUrlParams]
  );

  const handleDateSelect = (newDate: Date | undefined, fromView: CalendarViewType) => {
    if (!newDate) return;

    const newView = 'slots';
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
      onViewChange: handleViewChange,
    };

    switch (view) {
      case 'slots':
        return (
          <CalendarViewSlots
            {...props}
            selectedServiceId={selectedServiceId}
            timeRange={timeRange}
          />
        );
      default:
        return (
          <CalendarViewSlots
            {...props}
            selectedServiceId={selectedServiceId}
            timeRange={timeRange}
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
          availabilityData={availabilityData}
          selectedServiceId={selectedServiceId}
          onServiceSelect={handleServiceSelect}
        />
        <Suspense fallback={<CalendarSkeleton />}>{renderCalendar()}</Suspense>
      </div>
    </div>
  );
}
