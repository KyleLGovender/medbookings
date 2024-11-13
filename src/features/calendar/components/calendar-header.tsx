import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { ViewType } from '../lib/types'

interface CalendarHeaderProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
  title: string
  currentDate: Date
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarHeader({
  view,
  onViewChange,
  title,
  currentDate,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
      <h1 className="text-base font-semibold text-gray-900">
        <time dateTime={currentDate.toISOString()}>{title}</time>
      </h1>
      <div className="flex items-center">
        <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden md:ml-4 md:flex md:items-center">
          <Menu as="div" className="relative">
            <MenuButton
              type="button"
              className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {view.charAt(0).toUpperCase() + view.slice(1)} view
              <ChevronDownIcon className="-mr-1 size-5 text-gray-400" aria-hidden="true" />
            </MenuButton>

            <MenuItems className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
              <div className="py-1">
                {['day', 'week', 'month', 'consults'].map((viewType) => (
                  <MenuItem key={viewType}>
                    {({ active }) => (
                      <button
                        onClick={() => onViewChange(viewType as ViewType)}
                        className={`block w-full px-4 py-2 text-left text-sm ${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {viewType.charAt(0).toUpperCase() + viewType.slice(1)} view
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>
          <div className="ml-6 h-6 w-px bg-gray-300" />
          <button
            type="button"
            className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add event
          </button>
        </div>
      </div>
    </header>
  )
} 
