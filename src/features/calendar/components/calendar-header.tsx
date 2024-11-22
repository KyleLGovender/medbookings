'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { DateRange } from 'react-day-picker';

import { DatePicker } from '@/components/ui/date-picker';
import { DateRangeSelector } from '@/components/ui/date-range-selector';
import { AddAvailabilityButton } from '@/features/calendar/components/add-availability-button';
import { CalendarNavigation } from '@/features/calendar/components/calendar-navigation';

interface CalendarHeaderProps {
  view: 'schedule' | 'day' | 'week';
  currentDate: Date;
  dateRange?: DateRange;
  serviceProviderId: string;
  onDateSelect: (date: Date | undefined) => void;
  onDateRangeSelect: (range: DateRange | undefined) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: 'schedule' | 'day' | 'week') => void;
}

export function CalendarHeader({
  view,
  currentDate,
  dateRange = undefined,
  serviceProviderId,
  onDateSelect,
  onDateRangeSelect,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="mx-auto flex flex-col gap-2 md:mx-0 md:flex-row md:items-center">
        {view === 'schedule' ? (
          <DateRangeSelector dateRange={dateRange} onSelect={onDateRangeSelect} />
        ) : (
          <>
            <DatePicker date={currentDate} onChange={onDateSelect} />
            <CalendarNavigation onPrevious={onPrevious} onNext={onNext} onToday={onToday} />
          </>
        )}
      </div>

      {/* Navigation - centered on mobile, centered in middle section on desktop */}
      <div className="mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-center">
        <div className="mx-auto md:ml-4 md:flex md:items-center">
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

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <AddAvailabilityButton serviceProviderId={serviceProviderId} />
      </div>
    </header>
  );
}
