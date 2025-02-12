'use client';

import { useState } from 'react';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { DateRange } from 'react-day-picker';

import { DatePicker } from '@/components/ui/date-picker';
import { DateRangeSelector } from '@/components/ui/date-range-selector';
import { CalendarNavigation } from '@/features/calendar/components/calendar-navigation';

import { AvailabilityDialog } from './availability-dialog';

interface ServiceProviderCalendarHeaderProps {
  view: 'schedule' | 'day' | 'week';
  rangeStartDate: Date;
  dateRange?: DateRange;
  serviceProviderId: string;
  onDateSelect: (date: Date | undefined) => void;
  onDateRangeSelect: (range: DateRange | undefined) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: 'schedule' | 'day' | 'week') => void;
  onRefresh: () => Promise<void>;
  onThisWeek: () => void;
}

export function ServiceProviderCalendarHeader({
  view,
  rangeStartDate,
  dateRange = undefined,
  serviceProviderId,
  onDateSelect,
  onDateRangeSelect,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onRefresh,
  onThisWeek,
}: ServiceProviderCalendarHeaderProps) {
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);

  const handlePrevious = () => {
    onPrevious();
  };

  const handleNext = () => {
    onNext();
  };

  const handleToday = () => {
    onToday();
  };

  const handleDateSelect = (date: Date | undefined) => {
    onDateSelect(date);
  };

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange?.to) {
      onDateRangeSelect(newRange);
    }
  };

  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="mx-auto flex flex-col gap-2 md:mx-0 md:flex-row md:items-center">
        <div className="mx-auto md:flex md:items-center">
          <Menu as="div" className="relative">
            <MenuButton
              type="button"
              className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {view.charAt(0).toUpperCase() + view.slice(1)} view
              <ChevronDownIcon className="-mr-1 size-5 text-gray-400" aria-hidden="true" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <div className="py-1">
                {['day', 'week', 'schedule'].map((viewOption) => (
                  <MenuItem key={viewOption}>
                    <button
                      type="button"
                      onClick={() => onViewChange(viewOption as 'day' | 'week' | 'schedule')}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)} view
                    </button>
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>

      <div className="mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-center">
        {view === 'schedule' ? (
          <DateRangeSelector dateRange={dateRange} onSelect={handleDateRangeChange} />
        ) : (
          <>
            <DatePicker date={rangeStartDate} onChange={handleDateSelect} />
            <CalendarNavigation
              viewType={view}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              onThisWeek={onThisWeek}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <>
          <AvailabilityDialog
            mode="create"
            open={isAvailabilityDialogOpen}
            onOpenChange={setIsAvailabilityDialogOpen}
            serviceProviderId={serviceProviderId}
            onRefresh={onRefresh}
          />
          <div className="flex flex-col gap-2 md:flex-row">
            <button
              type="button"
              onClick={() => setIsAvailabilityDialogOpen(true)}
              className="mx-auto w-full max-w-sm rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:ml-2 md:w-auto"
            >
              Add availability
            </button>
          </div>
        </>
      </div>
    </header>
  );
}
