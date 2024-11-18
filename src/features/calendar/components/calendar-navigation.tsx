'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface CalendarNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarNavigation({ onPrevious, onNext, onToday }: CalendarNavigationProps) {
  return (
    <div className="mx-auto flex items-center gap-1">
      {/* Desktop view */}
      <div className="hidden md:relative md:flex md:items-center md:items-stretch md:rounded-md md:bg-white md:shadow-sm">
        <button
          type="button"
          onClick={onPrevious}
          className="flex h-9 w-9 items-center justify-center rounded-l-md border-y border-l border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:relative"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-r-md border-y border-r border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:relative"
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile view */}
      <div className="flex gap-1 md:hidden">
        <button
          type="button"
          onClick={onPrevious}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:relative"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="h-9 whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:relative"
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
