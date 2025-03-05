import { RefObject } from 'react';

import { CalendarItemAvailability } from '@/features/calendar/components/calendar-utils';
import { convertUTCToLocal } from '@/lib/timezone-helper';

import { getEventGridPosition, isSameDay } from '../../lib/helper';
import { AvailabilityView } from '../../lib/types';
import { CalendarViewTimeColumn } from '../calendar-utils/calendar-view-time-column';

// Server Component
interface CalendarViewDayTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  rangeStartDate: string;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewDayTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  rangeStartDate,
  availabilityData,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewDayTimeGridProps) {
  const dateObj = new Date(rangeStartDate);

  // Filter availabilities for current day
  const dayAvailabilities = availabilityData.filter((availability) =>
    isSameDay(new Date(availability.startTime), dateObj)
  );

  return (
    <>
      <header className="flex items-center justify-center border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
      </header>

      <div className="flex w-full flex-auto">
        <div className="sticky left-0 z-30 w-14 flex-none bg-white ring-1 ring-gray-100">
          <CalendarViewTimeColumn offsetRef={offsetRef} />
        </div>

        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time grid */}
          <div className="-z-10 col-start-1 col-end-2 row-start-1">
            <CalendarViewTimeColumn offsetRef={offsetRef} />
          </div>

          {/* Availability blocks */}
          <ol
            className="z-10 col-start-1 col-end-2 row-start-1 grid grid-cols-1"
            style={{
              gridTemplateRows: 'repeat(1440, minmax(0, 1fr))',
              height: '100%',
            }}
          >
            {dayAvailabilities.map((availability) => {
              const localStartTime = convertUTCToLocal(availability.startTime);
              const localEndTime = convertUTCToLocal(availability.endTime);
              const gridPosition = getEventGridPosition(localStartTime, localEndTime);

              return (
                <CalendarItemAvailability
                  key={availability.id}
                  availability={{
                    ...availability,
                    startTime: localStartTime,
                    endTime: localEndTime,
                  }}
                  gridPosition={gridPosition}
                  gridColumn={1}
                  serviceProviderId={serviceProviderId}
                  onRefresh={onRefresh}
                  onView={onView}
                  onEdit={onEdit}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );
}
