'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { DateRange } from 'react-day-picker';

import { getDateRange, getNextDate, getPreviousDate } from '@/features/calendar/lib/helper';
import { getServiceProviderAvailabilityInRange } from '@/features/calendar/lib/queries';
import { QueriedAvailability } from '@/features/calendar/lib/types';

import { BookingForm } from './booking-form';

interface BookingWrapperProps {
  initialAvailability: QueriedAvailability[];
  serviceProviderId: string;
  userId: string;
  initialDateRange: DateRange;
}

export function BookingWrapper({
  initialAvailability,
  serviceProviderId,
  userId,
  initialDateRange,
}: BookingWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [availability, setAvailability] = useState<QueriedAvailability[]>(initialAvailability);

  const updateUrlParams = (range: DateRange) => {
    const params = new URLSearchParams(searchParams);

    // Clear existing date params
    params.delete('start');
    params.delete('end');

    // Set new date params if they exist
    if (range.from) {
      params.set('start', range.from.toISOString().split('T')[0]);
    }
    if (range.to) {
      params.set('end', range.to.toISOString().split('T')[0]);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleDateChange = async (date: Date) => {
    const newRange = getDateRange(date, 'day');
    setDateRange(newRange);
    updateUrlParams(newRange);

    startTransition(async () => {
      const newAvailability = await getServiceProviderAvailabilityInRange(
        serviceProviderId,
        newRange.from!,
        newRange.to!
      );
      setAvailability(newAvailability);
    });
  };

  const handlePrevious = () => {
    const newDate = getPreviousDate(dateRange.from!, 'day');
    const newRange = getDateRange(newDate, 'day');
    setDateRange(newRange);
    updateUrlParams(newRange);
    updateAvailabilityData(newRange);
  };

  const handleNext = () => {
    const newDate = getNextDate(dateRange.from!, 'day');
    const newRange = getDateRange(newDate, 'day');
    setDateRange(newRange);
    updateUrlParams(newRange);
    updateAvailabilityData(newRange);
  };

  const handleToday = () => {
    const today = new Date();
    const newRange = getDateRange(today, 'day');
    setDateRange(newRange);
    updateUrlParams(newRange);
    updateAvailabilityData(newRange);
  };

  const updateAvailabilityData = async (range: DateRange) => {
    startTransition(async () => {
      const newAvailability = await getServiceProviderAvailabilityInRange(
        serviceProviderId,
        range.from!,
        range.to!
      );
      setAvailability(newAvailability);
    });
  };

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshedAvailability = await getServiceProviderAvailabilityInRange(
        serviceProviderId,
        dateRange.from!,
        dateRange.to!
      );
      setAvailability(refreshedAvailability);
    });
  };

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="mb-4 flex gap-4">
        <button
          onClick={handlePrevious}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={handleToday}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Today
        </button>
        <button
          onClick={handleNext}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Next
        </button>
      </div>

      <BookingForm
        serviceProviderId={serviceProviderId}
        userId={userId}
        availability={availability}
        selectedDate={dateRange.from!}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        isPending={isPending}
      />
    </div>
  );
}
