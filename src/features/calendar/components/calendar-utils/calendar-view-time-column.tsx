import React, { RefObject } from 'react';

import { TimeRange } from '../../lib/types';

interface CalendarViewTimeColumnProps {
  offsetRef: RefObject<HTMLDivElement>;
  timeRange: TimeRange;
}

export function CalendarViewTimeColumn({ offsetRef, timeRange }: CalendarViewTimeColumnProps) {
  const startHour = Math.floor(timeRange.earliestTime);
  const endHour = Math.ceil(timeRange.latestTime);
  const hoursToDisplay = endHour - startHour;

  return (
    <div
      className="pointer-events-none z-20 col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
      style={{
        gridTemplateRows: `repeat(${hoursToDisplay * 2}, minmax(1.75rem, 1fr))`,
      }}
    >
      {/* Time slots */}
      {Array.from({ length: hoursToDisplay }, (_, i) => {
        const hour = startHour + i;
        return (
          <React.Fragment key={hour}>
            <div>
              <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                {hour === 0
                  ? '12AM'
                  : hour < 12
                    ? `${hour}AM`
                    : hour === 12
                      ? '12PM'
                      : `${hour - 12}PM`}
              </div>
            </div>
            <div />
          </React.Fragment>
        );
      })}
    </div>
  );
}
